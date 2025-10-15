import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { tavily } from '@tavily/core'
import { LRUCache } from 'lru-cache'
import { temporalDetector } from '../../lib/temporalDetector'
import { trustScoreCalculator } from '../../lib/trustScoreCalculator'
import { analyzeRateLimiter } from '../../lib/rateLimit'
import { validateData, analyzeSchema } from '../../lib/validation'
import { optionalAuth } from '../../lib/auth'
import { costLogger } from '../../lib/costLogger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos timeout
})

// 🧠 Claude para análises de perspectivas (melhor qualidade)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

// LRU Cache com limite para buscas similares (15 minutos de TTL)
const CACHE_TTL = 15 * 60 * 1000 // 15 minutos
const searchCache = new LRUCache({
  max: 100, // Máximo de 100 entradas
  ttl: CACHE_TTL,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
})

// Função para gerar chave de cache
function getCacheKey(topic, perspectiveName, perspectiveFocus) {
  return `${topic.toLowerCase().trim()}:${perspectiveName}:${perspectiveFocus}`.replace(/\s+/g, '_')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate Limiting
  if (!analyzeRateLimiter.middleware(req, res)) {
    return // Rate limit exceeded, resposta já enviada
  }

  // Autenticação opcional (permite uso sem login, mas adiciona user se autenticado)
  await optionalAuth(req)

  try {
    // Validação de input
    const validation = validateData(analyzeSchema, req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error
      })
    }

    const { topic } = validation.data

    // 🕐 DETECTAR TERMOS TEMPORAIS NA QUERY
    const temporalInfo = temporalDetector.detect(topic)

    if (temporalInfo && temporalInfo.detected) {
      console.log(`[Temporal] Detectado: "${temporalInfo.label}" - ${temporalDetector.formatDateRange(temporalInfo)}`)
      console.log(`[Temporal] Query original: "${topic}"`)
      console.log(`[Temporal] Query aprimorada: "${temporalInfo.enhancedQuery}"`)
    }

    // Criar análise no banco (com user_id se autenticado)
    const analysisData = {
      topic: topic,
      status: 'processing'
    }

    // Adicionar user_id se autenticado
    if (req.user && req.user.id) {
      analysisData.user_id = req.user.id
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single()

    if (analysisError) throw analysisError

    // Gerar as 6 perspectivas com IA, passando informação temporal e analysisId para logging
    const perspectives = await generatePerspectives(topic, temporalInfo, analysis.id)

    // Salvar perspectivas no banco
    const perspectivesData = perspectives.map(p => ({
      analysis_id: analysis.id,
      type: p.type,
      content: p.content,
      sources: p.sources
      // Note: biases não são salvos no banco (campo não existe ainda)
      // mas são retornados na resposta da API
    }))

    const { error: perspectivesError } = await supabase
      .from('perspectives')
      .insert(perspectivesData)

    if (perspectivesError) throw perspectivesError

    // Gerar perguntas reflexivas
    const questions = await generateReflectiveQuestions(topic, perspectives, analysis.id)

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
    // Log de erro sem expor detalhes sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in analyze API:', error)
    } else {
      // Em produção, log apenas informação básica
      console.error('Error in analyze API:', error.message)
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    })
  }
}

// Função para filtrar fontes relevantes usando IA
async function filterRelevantSources(sources, topic, perspectiveFocus, analysisId = null) {
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

    // 💰 LOG de custo - Filtro de Fontes (GPT-3.5)
    if (analysisId && response.usage) {
      await costLogger.logFilterSources({
        analysisId: analysisId,
        usage: response.usage,
        model: 'gpt-3.5-turbo'
      })
    }

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

async function searchRealSources(topic, perspectiveName, perspectiveFocus, temporalInfo = null, analysisId = null) {
  try {
    // Verificar cache primeiro
    const cacheKey = getCacheKey(topic, perspectiveName, perspectiveFocus)
    const cached = searchCache.get(cacheKey)

    if (cached) {
      console.log(`[Cache HIT] ${perspectiveName} - usando resultados em cache`)
      // Mesmo com cache, aplicar filtro temporal se necessário
      if (temporalInfo && temporalInfo.detected) {
        const filteredData = {
          ...cached,
          sources: cached.sources // Fontes já foram filtradas quando salvas no cache
        }
        return filteredData
      }
      return cached
    }

    console.log(`[Cache MISS] ${perspectiveName} - buscando na web`)

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
    const relevantResults = await filterRelevantSources(results, topic, perspectiveFocus, analysisId)

    // Categorizar resultados relevantes por tipo de domínio
    const categorizedSources = {
      institucional: [],
      academico: [],
      video: [],
      midia: []
    }

    relevantResults.forEach(result => {
      const url = result.url.toLowerCase()

      // 🎯 CALCULAR TRUST SCORE
      const trustScoreData = trustScoreCalculator.calculate({
        url: result.url,
        title: result.title,
        content: result.content,
        published_date: result.published_date || result.publishedDate,
        author: result.author
      })

      const source = {
        title: result.title,
        url: result.url,
        content: result.content,
        // Adicionar dados de Trust Score
        trustScore: trustScoreData.score,
        trustLevel: trustScoreData.level,
        trustFactors: trustScoreData.factors,
        trustDetails: trustScoreData.details
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
    // 🎯 PRIORIZAR FONTES COM MAIOR TRUST SCORE
    const finalSources = []

    // Ordenar cada categoria por trust score
    Object.keys(categorizedSources).forEach(category => {
      categorizedSources[category].sort((a, b) => b.trustScore - a.trustScore)
    })

    if (categorizedSources.institucional.length > 0) {
      const s = categorizedSources.institucional[0]
      finalSources.push({
        type: 'institucional',
        title: s.title,
        url: s.url,
        trustScore: s.trustScore,
        trustLevel: s.trustLevel,
        trustFactors: s.trustFactors,
        trustDetails: s.trustDetails
      })
    }

    if (categorizedSources.academico.length > 0) {
      const s = categorizedSources.academico[0]
      finalSources.push({
        type: 'academico',
        title: s.title,
        url: s.url,
        trustScore: s.trustScore,
        trustLevel: s.trustLevel,
        trustFactors: s.trustFactors,
        trustDetails: s.trustDetails
      })
    }

    if (categorizedSources.video.length > 0) {
      const s = categorizedSources.video[0]
      finalSources.push({
        type: 'video',
        title: s.title,
        url: s.url,
        trustScore: s.trustScore,
        trustLevel: s.trustLevel,
        trustFactors: s.trustFactors,
        trustDetails: s.trustDetails
      })
    }

    if (categorizedSources.midia.length > 0) {
      const s = categorizedSources.midia[0]
      finalSources.push({
        type: 'midia',
        title: s.title,
        url: s.url,
        trustScore: s.trustScore,
        trustLevel: s.trustLevel,
        trustFactors: s.trustFactors,
        trustDetails: s.trustDetails
      })
    }

    // Se não conseguiu pelo menos 3 fontes, pegar os primeiros resultados relevantes (com maior trust score)
    if (finalSources.length < 3 && relevantResults.length > 0) {
      // Calcular trust score para os resultados relevantes e ordenar
      const remainingWithScores = relevantResults
        .slice(0, 4 - finalSources.length)
        .map(r => {
          const trustData = trustScoreCalculator.calculate({
            url: r.url,
            title: r.title,
            content: r.content,
            published_date: r.published_date || r.publishedDate,
            author: r.author
          })
          return {
            ...r,
            trustScore: trustData.score,
            trustLevel: trustData.level,
            trustFactors: trustData.factors,
            trustDetails: trustData.details
          }
        })
        .sort((a, b) => b.trustScore - a.trustScore)

      remainingWithScores.forEach(r => {
        finalSources.push({
          type: 'midia',
          title: r.title,
          url: r.url,
          trustScore: r.trustScore,
          trustLevel: r.trustLevel,
          trustFactors: r.trustFactors,
          trustDetails: r.trustDetails
        })
      })
    }

    // 📊 LOG: Trust Score médio das fontes
    const avgTrustScore = trustScoreCalculator.calculateAverage(
      finalSources.map(s => ({ url: s.url, title: s.title }))
    )
    console.log(`[Trust Score] ${perspectiveName}: Média de confiabilidade = ${avgTrustScore}/100`)

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

    // Salvar no cache (LRU gerencia TTL automaticamente)
    searchCache.set(cacheKey, result)

    console.log(`[Cache SAVE] ${perspectiveName} - resultados salvos no cache`)

    return result

  } catch (error) {
    console.error('Error searching sources:', error)
    return { sources: [], searchContext: '' }
  }
}

// Função para validar alinhamento entre conteúdo gerado e fontes
async function validateSourceAlignment(content, sources, topic, analysisId = null) {
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

    // 💰 LOG de custo - Validação de Alinhamento (GPT-3.5)
    if (analysisId && response.usage) {
      await costLogger.logValidateAlignment({
        analysisId: analysisId,
        usage: response.usage,
        model: 'gpt-3.5-turbo'
      })
    }

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

async function generatePerspectives(topic, temporalInfo = null, analysisId = null) {
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
    const { sources, searchContext } = await searchRealSources(topic, pt.name, pt.focus, temporalInfo, analysisId)

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

⚠️ DETECÇÃO DE VIESES - MUITO IMPORTANTE:
Após a análise, identifique EXPLICITAMENTE possíveis vieses:
- Vieses ideológicos ou políticos presentes
- Conflitos de interesse das fontes (quem financia?)
- Limitações metodológicas evidentes
- Perspectivas sub-representadas ou ausentes
- Suposições não questionadas

FORMATO DE RESPOSTA OBRIGATÓRIO:
[ANÁLISE]
Seu texto de 2-3 parágrafos aqui...

[VIESES]
- Viés 1: descrição
- Viés 2: descrição
(Se não houver vieses significativos, escreva "Nenhum viés significativo identificado")`

    // 🧠 USAR CLAUDE para análises (melhor qualidade, detecção de vieses superior)
    const contentCompletion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      temperature: 0.5,
      system: 'Você é um analista imparcial especializado em fornecer análises focadas e objetivas sobre temas específicos.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generatedContent = contentCompletion.content[0].text

    // 💰 LOG de custo - Análise de Perspectiva (Claude)
    if (analysisId) {
      await costLogger.logPerspectiveAnalysis({
        analysisId: analysisId,
        perspectiveType: pt.type,
        usage: contentCompletion.usage,
        model: 'claude-sonnet-4-20250514'
      })
    }

    // 🔍 PARSING: Separar análise e vieses
    let analysisText = generatedContent
    let biases = []

    if (generatedContent.includes('[VIESES]')) {
      const parts = generatedContent.split('[VIESES]')
      analysisText = parts[0].replace('[ANÁLISE]', '').trim()

      const biasesText = parts[1].trim()

      // Extrair vieses da lista
      biases = biasesText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())
        .filter(bias => bias.length > 0)

      // Log de vieses detectados
      if (biases.length > 0 && !biases[0].toLowerCase().includes('nenhum')) {
        console.log(`[${pt.name}] 🎯 ${biases.length} viese(s) detectado(s)`)
      }
    } else {
      // Se não tiver formato esperado, usar conteúdo como está
      console.warn(`[${pt.name}] ⚠️ Formato de resposta não incluiu seção [VIESES]`)
    }

    // Validar alinhamento entre conteúdo e fontes
    const validation = await validateSourceAlignment(analysisText, sources, topic, analysisId)

    // Log para monitoramento de qualidade
    console.log(`[${pt.name}] Alinhamento: ${validation.score}/100 - ${validation.reason || 'OK'}`)

    // Se o alinhamento for muito baixo, adicionar aviso no log (mas não bloquear)
    if (validation.needsImprovement) {
      console.warn(`[${pt.name}] ⚠️ Baixo alinhamento com fontes. Considere revisar.`)
    }

    return {
      type: pt.type,
      content: analysisText,
      biases: biases, // 🆕 Incluir vieses detectados
      sources: sources,
      alignmentScore: validation.score // Adicionar score para análise futura
    }
  })

  const perspectives = await Promise.all(perspectivesPromises)
  return perspectives
}

async function generateReflectiveQuestions(topic, perspectives, analysisId = null) {
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

  // 💰 LOG de custo - Perguntas Reflexivas (GPT-3.5)
  if (analysisId && completion.usage) {
    await costLogger.logReflectiveQuestions({
      analysisId: analysisId,
      usage: completion.usage,
      model: 'gpt-3.5-turbo'
    })
  }

  const questions = completion.choices[0].message.content
    .split('\n')
    .filter(q => q.trim().length > 0)
    .slice(0, 5)

  return questions
}
