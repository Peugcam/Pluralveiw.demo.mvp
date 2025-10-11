import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { tavily } from '@tavily/core'
import { temporalDetector } from '../../lib/temporalDetector'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

// Cache em memória para buscas similares (15 minutos de TTL)
const searchCache = new Map()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutos

// Função para gerar chave de cache
function getCacheKey(topic, perspectiveName, perspectiveFocus) {
  return `${topic.toLowerCase().trim()}:${perspectiveName}:${perspectiveFocus}`.replace(/\s+/g, '_')
}

// Função para limpar cache expirado
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      searchCache.delete(key)
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { topic } = req.body

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' })
    }

    // 🕐 DETECTAR TERMOS TEMPORAIS NA QUERY
    const temporalInfo = temporalDetector.detect(topic)

    if (temporalInfo && temporalInfo.detected) {
      console.log(`[Temporal] Detectado: "${temporalInfo.label}" - ${temporalDetector.formatDateRange(temporalInfo)}`)
      console.log(`[Temporal] Query original: "${topic}"`)
      console.log(`[Temporal] Query aprimorada: "${temporalInfo.enhancedQuery}"`)
    }

    // Criar análise no banco (sem user_id para MVP)
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        topic: topic,
        status: 'processing'
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    // Gerar as 6 perspectivas com IA, passando informação temporal
    const perspectives = await generatePerspectives(topic, temporalInfo)

    // Salvar perspectivas no banco
    const perspectivesData = perspectives.map(p => ({
      analysis_id: analysis.id,
      type: p.type,
      content: p.content,
      sources: p.sources
    }))

    const { error: perspectivesError } = await supabase
      .from('perspectives')
      .insert(perspectivesData)

    if (perspectivesError) throw perspectivesError

    // Gerar perguntas reflexivas
    const questions = await generateReflectiveQuestions(topic, perspectives)

    // Salvar perguntas no banco
    const questionsData = questions.map(q => ({
      analysis_id: analysis.id,
      question: q
    }))

    const { error: questionsError } = await supabase
      .from('reflective_questions')
      .insert(questionsData)

    if (questionsError) throw questionsError

    // Atualizar status da análise
    await supabase
      .from('analyses')
      .update({ status: 'completed' })
      .eq('id', analysis.id)

    // Preparar resposta com informação temporal se disponível
    const response = {
      success: true,
      analysisId: analysis.id,
      perspectives,
      questions
    }

    // 🕐 ADICIONAR INFORMAÇÃO TEMPORAL NA RESPOSTA
    if (temporalInfo && temporalInfo.detected) {
      response.temporalInfo = {
        detected: true,
        type: temporalInfo.type,
        label: temporalInfo.label,
        dateRange: temporalDetector.formatDateRange(temporalInfo),
        startDate: temporalInfo.startDate.toISOString(),
        endDate: temporalInfo.endDate.toISOString()
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Error in analyze API:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    res.status(500).json({
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Função para filtrar fontes relevantes usando IA
async function filterRelevantSources(sources, topic, perspectiveFocus) {
  try {
    // Filtrar fontes em lote para economia de tokens
    const sourcesText = sources.map((s, idx) =>
      `[${idx}] Título: ${s.title}\nConteúdo: ${s.content.substring(0, 300)}...`
    ).join('\n\n')

    const prompt = `Analise quais das seguintes fontes são RELEVANTES para uma análise sobre "${topic}" com foco em "${perspectiveFocus}".

FONTES:
${sourcesText}

Responda APENAS com os números das fontes relevantes separados por vírgula (ex: 0,2,4).
Se nenhuma for relevante, responda "nenhuma".`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 50
    })

    const relevantIndices = response.choices[0].message.content.trim().toLowerCase()

    if (relevantIndices === 'nenhuma') {
      return sources.slice(0, 3) // Retornar as 3 primeiras se nenhuma for considerada relevante
    }

    const indices = relevantIndices.split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i))
    return indices.map(i => sources[i]).filter(Boolean)
  } catch (error) {
    console.error('Error filtering relevant sources:', error)
    return sources.slice(0, 6) // Em caso de erro, retornar as primeiras
  }
}

async function searchRealSources(topic, perspectiveName, perspectiveFocus, temporalInfo = null) {
  try {
    // Verificar cache primeiro
    const cacheKey = getCacheKey(topic, perspectiveName, perspectiveFocus)
    const cached = searchCache.get(cacheKey)

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[Cache HIT] ${perspectiveName} - usando resultados em cache`)
      // Mesmo com cache, aplicar filtro temporal se necessário
      if (temporalInfo && temporalInfo.detected) {
        const filteredData = {
          ...cached.data,
          sources: cached.data.sources // Fontes já foram filtradas quando salvas no cache
        }
        return filteredData
      }
      return cached.data
    }

    console.log(`[Cache MISS] ${perspectiveName} - buscando na web`)

    // Limpar cache expirado periodicamente
    if (searchCache.size > 50) {
      cleanExpiredCache()
    }

    // 🕐 USAR QUERY APRIMORADA SE HOUVER INFORMAÇÃO TEMPORAL
    let searchQuery = `${topic} ${perspectiveName} ${perspectiveFocus}`

    if (temporalInfo && temporalInfo.detected) {
      // Usar a query aprimorada que inclui contexto de data
      searchQuery = `${temporalInfo.enhancedQuery} ${perspectiveName} ${perspectiveFocus}`
      console.log(`[Temporal Search] ${perspectiveName}: "${searchQuery}"`)
    }

    const searchResult = await tavilyClient.search(searchQuery, {
      maxResults: 15, // Buscar mais resultados para compensar filtros
      includeAnswer: false,
      includeRawContent: false
    })

    let results = searchResult.results || []

    // 🕐 FILTRAR RESULTADOS POR DATA SE TEMPORAL INFO PRESENTE
    if (temporalInfo && temporalInfo.detected) {
      const originalCount = results.length
      results = results.filter(result => temporalDetector.validateResult(result, temporalInfo))
      console.log(`[Temporal Filter] ${perspectiveName}: ${originalCount} resultados → ${results.length} após filtro temporal`)

      // Se filtrou demais, avisar
      if (results.length < 3) {
        console.warn(`[Temporal Filter] ${perspectiveName}: Poucos resultados após filtro temporal (${results.length}). Dados podem ser limitados.`)
      }
    }

    // Filtrar fontes relevantes usando IA
    const relevantResults = await filterRelevantSources(results, topic, perspectiveFocus)

    // Categorizar resultados relevantes por tipo de domínio
    const categorizedSources = {
      institucional: [],
      academico: [],
      video: [],
      midia: []
    }

    relevantResults.forEach(result => {
      const url = result.url.toLowerCase()
      const source = {
        title: result.title,
        url: result.url,
        content: result.content
      }

      // Institucional: gov, org, instituições
      if (url.includes('.gov') || url.includes('.org') || url.includes('governo') || url.includes('institution')) {
        categorizedSources.institucional.push(source)
      }
      // Acadêmico: edu, scielo, scholar, universidades
      else if (url.includes('.edu') || url.includes('scholar') || url.includes('scielo') || url.includes('universidade') || url.includes('academic')) {
        categorizedSources.academico.push(source)
      }
      // Vídeo: YouTube
      else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        categorizedSources.video.push(source)
      }
      // Mídia: jornais, revistas, blogs de notícias
      else {
        categorizedSources.midia.push(source)
      }
    })

    // Selecionar 1 de cada tipo (ou o que estiver disponível)
    const finalSources = []

    if (categorizedSources.institucional.length > 0) {
      const s = categorizedSources.institucional[0]
      finalSources.push({ type: 'institucional', title: s.title, url: s.url })
    }

    if (categorizedSources.academico.length > 0) {
      const s = categorizedSources.academico[0]
      finalSources.push({ type: 'academico', title: s.title, url: s.url })
    }

    if (categorizedSources.video.length > 0) {
      const s = categorizedSources.video[0]
      finalSources.push({ type: 'video', title: s.title, url: s.url })
    }

    if (categorizedSources.midia.length > 0) {
      const s = categorizedSources.midia[0]
      finalSources.push({ type: 'midia', title: s.title, url: s.url })
    }

    // Se não conseguiu pelo menos 3 fontes, pegar os primeiros resultados relevantes
    if (finalSources.length < 3 && relevantResults.length > 0) {
      const remaining = relevantResults.slice(0, 4 - finalSources.length)
      remaining.forEach(r => {
        finalSources.push({
          type: 'midia',
          title: r.title,
          url: r.url
        })
      })
    }

    // Aumentar contexto com mais fontes relevantes e informações estruturadas
    const contextSources = relevantResults.slice(0, 6).map(r => ({
      title: r.title,
      content: r.content,
      url: r.url
    }))

    const searchContext = contextSources
      .map(r => `📄 Fonte: ${r.title}\nURL: ${r.url}\nConteúdo: ${r.content}`)
      .join('\n\n---\n\n')

    const result = {
      sources: finalSources,
      searchContext: searchContext
    }

    // Salvar no cache
    searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    console.log(`[Cache SAVE] ${perspectiveName} - resultados salvos no cache`)

    return result

  } catch (error) {
    console.error('Error searching sources:', error)
    return { sources: [], searchContext: '' }
  }
}

// Função para validar alinhamento entre conteúdo gerado e fontes
async function validateSourceAlignment(content, sources, topic) {
  try {
    if (!sources || sources.length === 0) {
      return { aligned: true, score: 100, needsImprovement: false }
    }

    const sourceTitles = sources.map(s => s.title).join('\n')

    const prompt = `Analise se o texto abaixo está alinhado e cita/referencia as fontes fornecidas.

TEXTO GERADO:
${content}

FONTES DISPONÍVEIS:
${sourceTitles}

AVALIE:
1. O texto menciona ou cita informações das fontes?
2. As fontes são relevantes para o que foi escrito?
3. Score de alinhamento (0-100)

Responda APENAS em formato JSON:
{"aligned": true/false, "score": 0-100, "reason": "breve explicação"}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 150
    })

    const result = JSON.parse(response.choices[0].message.content)

    return {
      aligned: result.score >= 60,
      score: result.score,
      reason: result.reason,
      needsImprovement: result.score < 60
    }
  } catch (error) {
    console.error('Error validating source alignment:', error)
    return { aligned: true, score: 100, needsImprovement: false } // Em caso de erro, prosseguir
  }
}

async function generatePerspectives(topic, temporalInfo = null) {
  const perspectiveTypes = [
    { type: 'tecnica', name: 'Técnica', focus: 'aspectos técnicos, dados, evidências científicas' },
    { type: 'popular', name: 'Popular', focus: 'senso comum, impacto no dia a dia das pessoas' },
    { type: 'institucional', name: 'Institucional', focus: 'posição de instituições, órgãos oficiais, governos' },
    { type: 'academica', name: 'Acadêmica', focus: 'teorias, pesquisas, visão científica e universitária' },
    { type: 'conservadora', name: 'Conservadora', focus: 'tradição, valores conservadores, cautela com mudanças' },
    { type: 'progressista', name: 'Progressista', focus: 'mudança social, inovação, justiça e equidade' }
  ]

  // Gerar todas as perspectivas em paralelo
  const perspectivesPromises = perspectiveTypes.map(async (pt) => {
    // Buscar fontes reais na web, passando o foco para busca mais precisa E informação temporal
    const { sources, searchContext } = await searchRealSources(topic, pt.name, pt.focus, temporalInfo)

    // 🕐 ADICIONAR CONTEXTO TEMPORAL AO PROMPT SE DISPONÍVEL
    let temporalContext = ''
    if (temporalInfo && temporalInfo.detected) {
      temporalContext = `
⏰ IMPORTANTE - CONTEXTO TEMPORAL:
Esta consulta refere-se especificamente a: ${temporalInfo.label}
Período: ${temporalDetector.formatDateRange(temporalInfo)}
Data atual: ${temporalDetector.formatDate(new Date())}

INSTRUÇÕES TEMPORAIS:
- Foque APENAS em informações deste período específico
- Se os dados não forem recentes o suficiente, mencione isso explicitamente
- Priorize fontes com datas dentro do período solicitado
- NÃO use informações desatualizadas ou de períodos diferentes
`
    }

    // Gerar análise baseada no conteúdo real encontrado
    const prompt = `Você é um analista especializado em análise de múltiplas perspectivas.

TEMA EXATO A SER ANALISADO: "${topic}"
${temporalContext}
PERSPECTIVA A ANALISAR: ${pt.name}
FOCO: ${pt.focus}

CONTEXTO DE FONTES REAIS ENCONTRADAS:
${searchContext || 'Nenhum contexto específico encontrado. Use seu conhecimento geral.'}

INSTRUÇÕES IMPORTANTES:
- Mantenha o foco EXCLUSIVAMENTE no tema "${topic}"
- NÃO fuja do tema ou faça generalizações amplas
- Seja específico sobre "${topic}" sob a perspectiva ${pt.name}
- **CITE EXPLICITAMENTE as fontes fornecidas acima quando relevantes**
- Use expressões como: "Segundo [fonte]...", "Estudos indicam que...", "De acordo com...", "Dados mostram que..."
- Integre naturalmente informações e dados das fontes no texto
- Se mencionar um dado ou fato específico, referencie a fonte de onde veio
- Escreva 2-3 parágrafos focados e bem fundamentados
- Priorize informações das fontes fornecidas sobre conhecimento geral

FORMATO DE CITAÇÃO:
- Use citações naturais integradas ao texto (não use numeração ou lista de referências)
- Exemplo: "Estudos recentes demonstram que..." ou "Segundo análise da [instituição]..."

RESPONDA APENAS com a análise, SEM título ou introdução.`

    const contentCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista imparcial especializado em fornecer análises focadas e objetivas sobre temas específicos.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 600
    })

    const generatedContent = contentCompletion.choices[0].message.content

    // Validar alinhamento entre conteúdo e fontes
    const validation = await validateSourceAlignment(generatedContent, sources, topic)

    // Log para monitoramento de qualidade
    console.log(`[${pt.name}] Alinhamento: ${validation.score}/100 - ${validation.reason || 'OK'}`)

    // Se o alinhamento for muito baixo, adicionar aviso no log (mas não bloquear)
    if (validation.needsImprovement) {
      console.warn(`[${pt.name}] ⚠️ Baixo alinhamento com fontes. Considere revisar.`)
    }

    return {
      type: pt.type,
      content: generatedContent,
      sources: sources,
      alignmentScore: validation.score // Adicionar score para análise futura
    }
  })

  const perspectives = await Promise.all(perspectivesPromises)
  return perspectives
}

async function generateReflectiveQuestions(topic, perspectives) {
  const perspectivesText = perspectives.map(p =>
    `${p.type}: ${p.content.substring(0, 200)}...`
  ).join('\n\n')

  const prompt = `Baseado nestas perspectivas sobre "${topic}":

${perspectivesText}

Gere 5 perguntas reflexivas que:
1. Estimulem pensamento crítico
2. Conectem diferentes perspectivas
3. Incentivem o leitor a formar sua própria opinião
4. Sejam abertas (sem resposta certa/errada)

Formato: Uma pergunta por linha, sem numeração.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 300
  })

  const questions = completion.choices[0].message.content
    .split('\n')
    .filter(q => q.trim().length > 0)
    .slice(0, 5)

  return questions
}
