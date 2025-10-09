import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { tavily } from '@tavily/core'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { topic } = req.body

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' })
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

    // Gerar as 6 perspectivas com IA
    const perspectives = await generatePerspectives(topic)

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

    res.status(200).json({
      success: true,
      analysisId: analysis.id,
      perspectives,
      questions
    })

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

async function searchRealSources(topic, perspectiveName) {
  try {
    // Fazer busca real na web sobre o tema
    const searchQuery = `${topic} ${perspectiveName}`
    const searchResult = await tavilyClient.search(searchQuery, {
      maxResults: 8,
      includeAnswer: false,
      includeRawContent: false
    })

    const results = searchResult.results || []

    // Categorizar resultados por tipo de domínio
    const categorizedSources = {
      institucional: [],
      academico: [],
      video: [],
      midia: []
    }

    results.forEach(result => {
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

    // Se não conseguiu pelo menos 3 fontes, pegar os primeiros resultados
    if (finalSources.length < 3 && results.length > 0) {
      const remaining = results.slice(0, 4 - finalSources.length)
      remaining.forEach(r => {
        finalSources.push({
          type: 'midia',
          title: r.title,
          url: r.url
        })
      })
    }

    return {
      sources: finalSources,
      searchContext: results.slice(0, 3).map(r => r.content).join('\n\n')
    }

  } catch (error) {
    console.error('Error searching sources:', error)
    return { sources: [], searchContext: '' }
  }
}

async function generatePerspectives(topic) {
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
    // Buscar fontes reais na web
    const { sources, searchContext } = await searchRealSources(topic, pt.name)

    // Gerar análise baseada no conteúdo real encontrado
    const prompt = `Você é um analista especializado em análise de múltiplas perspectivas.

TEMA EXATO A SER ANALISADO: "${topic}"

PERSPECTIVA A ANALISAR: ${pt.name}
FOCO: ${pt.focus}

CONTEXTO DE FONTES REAIS ENCONTRADAS:
${searchContext || 'Nenhum contexto específico encontrado. Use seu conhecimento geral.'}

INSTRUÇÕES IMPORTANTES:
- Mantenha o foco EXCLUSIVAMENTE no tema "${topic}"
- NÃO fuja do tema ou faça generalizações amplas
- Seja específico sobre "${topic}" sob a perspectiva ${pt.name}
- Cite exemplos DIRETAMENTE relacionados a "${topic}"
- Escreva 2-3 parágrafos focados
- Se o contexto acima tiver informações relevantes, considere-as na análise

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

    return {
      type: pt.type,
      content: contentCompletion.choices[0].message.content,
      sources: sources
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
