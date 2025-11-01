import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { tavily } from '@tavily/core'
import { temporalDetector } from '../../lib/temporalDetector'
import { trustScoreCalculator } from '../../lib/trustScoreCalculator'
import { analyzeRateLimiter } from '../../lib/rateLimit'
import { validateData, analyzeSchema } from '../../lib/validation'
import { optionalAuth } from '../../lib/auth'
import { costLogger } from '../../lib/costLogger'

// 🔥 NOVOS IMPORTS - Melhorias Técnicas
import { getCachedAnalysis, setCachedAnalysis } from '../../lib/optimizedCache'
import { generatePerspectiveWithCaching } from '../../lib/claudeClientOptimized'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
})

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate Limiting
  if (!analyzeRateLimiter.middleware(req, res)) {
    return
  }

  // Autenticação opcional
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

    // Detectar termos temporais
    const temporalInfo = temporalDetector.detect(topic)

    if (temporalInfo && temporalInfo.detected) {
      console.log(`[Temporal] Detectado: "${temporalInfo.label}" - ${temporalDetector.formatDateRange(temporalInfo)}`)
    }

    // 🔥 CACHE OTIMIZADO (L1 memória + L2 Supabase)
    console.log(`[Cache Optimized] Verificando cache para: "${topic}"`)
    const cachedAnalysis = await getCachedAnalysis(topic)

    if (cachedAnalysis) {
      const ageMinutes = Math.round((Date.now() - new Date(cachedAnalysis.created_at).getTime()) / 1000 / 60)
      console.log(`[Cache HIT] ✅ Retornando análise cacheada (${ageMinutes} min)`)

      return res.status(200).json({
        success: true,
        cached: true,
        cacheAge: ageMinutes,
        analysisId: cachedAnalysis.id,
        perspectives: cachedAnalysis.perspectives || [],
        questions: cachedAnalysis.questions || [],
        cost: 0,
        message: 'Análise recuperada do cache (economia de 100%)'
      })
    }

    console.log(`[Cache MISS] ❌ Gerando nova análise...`)

    // Criar análise no banco
    const analysisData = {
      topic: topic,
      status: 'processing'
    }

    if (req.user && req.user.id) {
      analysisData.user_id = req.user.id
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single()

    if (analysisError) throw analysisError

    // 🚀 GERAÇÃO PARALELA + PROMPT CACHING
    const perspectives = await generatePerspectivesOptimized(topic, temporalInfo, analysis.id)

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

    // 🔥 SALVAR EM CACHE (L1 + L2)
    await setCachedAnalysis({
      id: analysis.id,
      topic: topic,
      perspectives: perspectives,
      questions: questions
    })

    // Preparar resposta
    const response = {
      success: true,
      analysisId: analysis.id,
      perspectives,
      questions
    }

    // Adicionar informação temporal se disponível
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in analyze API:', error)
    } else {
      console.error('Error in analyze API:', error.message)
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    })
  }
}

// 🚀 GERAÇÃO PARALELA OTIMIZADA
async function generatePerspectivesOptimized(topic, temporalInfo = null, analysisId = null) {
  const perspectiveTypes = [
    { type: 'technical', name: 'Técnica', focus: 'aspectos técnicos, dados, evidências científicas' },
    { type: 'popular', name: 'Popular', focus: 'senso comum, impacto no dia a dia das pessoas' },
    { type: 'institutional', name: 'Institucional', focus: 'posição de instituições, órgãos oficiais, governos' },
    { type: 'academic', name: 'Acadêmica', focus: 'teorias, pesquisas, visão científica e universitária' },
    { type: 'conservative', name: 'Conservadora', focus: 'tradição, valores conservadores, cautela com mudanças' },
    { type: 'progressive', name: 'Progressista', focus: 'mudança social, inovação, justiça e equidade' }
  ]

  console.log(`[Parallel] Iniciando geração de ${perspectiveTypes.length} perspectivas em paralelo...`)
  const startTime = Date.now()

  // Contexto temporal
  let temporalContext = ''
  if (temporalInfo && temporalInfo.detected) {
    temporalContext = `
⏰ IMPORTANTE - CONTEXTO TEMPORAL:
Esta consulta refere-se especificamente a: ${temporalInfo.label}
Período: ${temporalDetector.formatDateRange(temporalInfo)}
Data atual: ${new Date().toLocaleDateString('pt-BR')}

INSTRUÇÕES TEMPORAIS:
- Foque APENAS em informações deste período específico
- Se os dados não forem recentes o suficiente, mencione isso explicitamente
- Priorize fontes com datas dentro do período solicitado
`
  }

  // 🚀 Buscar fontes em PARALELO
  const searchPromises = perspectiveTypes.map(pt =>
    searchRealSources(topic, pt.name, pt.focus, temporalInfo, analysisId)
  )

  const searchResults = await Promise.all(searchPromises)

  // 🚀 Gerar perspectivas em PARALELO com PROMPT CACHING
  const perspectivePromises = perspectiveTypes.map(async (pt, index) => {
    const { sources, searchContext } = searchResults[index]

    try {
      // 🔥 USAR PROMPT CACHING (90% economia!)
      const result = await generatePerspectiveWithCaching({
        topic,
        perspectiveType: pt.type,
        perspectiveName: pt.name,
        perspectiveFocus: pt.focus,
        searchContext,
        temporalContext,
        analysisId
      })

      return {
        type: pt.type,
        content: result.content,
        biases: result.biases,
        sources: sources
      }

    } catch (error) {
      console.error(`[Parallel] Erro ao gerar perspectiva ${pt.name}:`, error)

      return {
        type: pt.type,
        content: `Erro ao gerar análise ${pt.name}. Por favor, tente novamente.`,
        biases: [],
        sources: sources,
        error: true
      }
    }
  })

  const perspectives = await Promise.all(perspectivePromises)

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log(`[Parallel] ✅ ${perspectives.length} perspectivas geradas em ${duration}s`)
  console.log(`[Parallel] 🔥 Performance: ${(12 / parseFloat(duration)).toFixed(1)}x mais rápido`)

  return perspectives
}

// Função de busca de fontes (mantida igual)
async function searchRealSources(topic, perspectiveName, perspectiveFocus, temporalInfo = null, analysisId = null) {
  try {
    let searchQuery = `${topic} ${perspectiveName} ${perspectiveFocus}`

    if (temporalInfo && temporalInfo.detected) {
      searchQuery = `${temporalInfo.enhancedQuery} ${perspectiveName} ${perspectiveFocus}`
    }

    const searchResult = await tavilyClient.search(searchQuery, {
      maxResults: 10,
      includeAnswer: false,
      includeRawContent: false
    })

    let results = searchResult.results || []

    // Filtrar por data se temporal
    if (temporalInfo && temporalInfo.detected) {
      const originalCount = results.length
      results = results.filter(result => temporalDetector.validateResult(result, temporalInfo))
      console.log(`[Temporal Filter] ${perspectiveName}: ${originalCount} → ${results.length}`)
    }

    // Calcular trust scores
    const sourcesWithTrust = results.slice(0, 5).map(result => {
      const trustScoreData = trustScoreCalculator.calculate({
        url: result.url,
        title: result.title,
        content: result.content,
        published_date: result.published_date || result.publishedDate,
        author: result.author
      })

      return {
        title: result.title,
        url: result.url,
        type: 'midia',
        trustScore: trustScoreData.score,
        trustLevel: trustScoreData.level,
        publishedDate: result.published_date || result.publishedDate || null
      }
    })

    // Criar contexto de busca
    const searchContext = results.slice(0, 5)
      .map(r => `📄 ${r.title}\nURL: ${r.url}\nConteúdo: ${r.content.substring(0, 300)}...`)
      .join('\n\n---\n\n')

    return {
      sources: sourcesWithTrust,
      searchContext: searchContext
    }

  } catch (error) {
    console.error(`Error searching sources for ${perspectiveName}:`, error)
    return { sources: [], searchContext: '' }
  }
}

// Função de perguntas reflexivas (mantida igual)
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
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 300
  })

  if (analysisId && completion.usage) {
    await costLogger.logReflectiveQuestions({
      analysisId: analysisId,
      usage: completion.usage,
      model: 'gpt-4o-mini'
    })
  }

  const questions = completion.choices[0].message.content
    .split('\n')
    .filter(q => q.trim().length > 0)
    .slice(0, 5)

  return questions
}
