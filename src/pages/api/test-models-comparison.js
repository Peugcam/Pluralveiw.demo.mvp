import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { tavily } from '@tavily/core'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { topic = 'Energia solar' } = req.body

    console.log(`\n🧪 TESTE COMPARATIVO: "${topic}"\n`)

    // ============================================
    // CENÁRIO 1: MODELOS ATUAIS (Sonnet 4 + GPT-3.5)
    // ============================================
    console.log('📊 Testando CENÁRIO 1: Sonnet 4 + GPT-3.5-turbo')
    const scenario1Start = Date.now()
    const scenario1 = await testScenario({
      topic,
      claudeModel: 'claude-sonnet-4-20250514',
      gptModel: 'gpt-3.5-turbo',
      label: 'ATUAL'
    })
    const scenario1Time = Date.now() - scenario1Start

    // ============================================
    // CENÁRIO 2: MODELOS NOVOS (Haiku + GPT-4o-mini)
    // ============================================
    console.log('\n📊 Testando CENÁRIO 2: Haiku 3.5 + GPT-4o-mini')
    const scenario2Start = Date.now()
    const scenario2 = await testScenario({
      topic,
      claudeModel: 'claude-3-5-haiku-20241022',
      gptModel: 'gpt-4o-mini',
      label: 'NOVO'
    })
    const scenario2Time = Date.now() - scenario2Start

    // ============================================
    // COMPARAÇÃO
    // ============================================
    const comparison = {
      topic,
      scenarios: {
        atual: {
          models: {
            claude: 'claude-sonnet-4-20250514',
            gpt: 'gpt-3.5-turbo'
          },
          perspective: scenario1.perspective,
          reflectiveQuestion: scenario1.reflectiveQuestion,
          costs: scenario1.costs,
          totalCost: scenario1.totalCost,
          time: scenario1Time,
          quality: {
            perspectiveLength: scenario1.perspective.content.length,
            biasesDetected: scenario1.perspective.biases.length,
            sourcesCount: scenario1.perspective.sources.length
          }
        },
        novo: {
          models: {
            claude: 'claude-3-5-haiku-20241022',
            gpt: 'gpt-4o-mini'
          },
          perspective: scenario2.perspective,
          reflectiveQuestion: scenario2.reflectiveQuestion,
          costs: scenario2.costs,
          totalCost: scenario2.totalCost,
          time: scenario2Time,
          quality: {
            perspectiveLength: scenario2.perspective.content.length,
            biasesDetected: scenario2.perspective.biases.length,
            sourcesCount: scenario2.perspective.sources.length
          }
        }
      },
      comparison: {
        costSavings: {
          absolute: scenario1.totalCost - scenario2.totalCost,
          percentage: ((scenario1.totalCost - scenario2.totalCost) / scenario1.totalCost * 100).toFixed(1)
        },
        timeImprovement: {
          absolute: scenario1Time - scenario2Time,
          percentage: ((scenario1Time - scenario2Time) / scenario1Time * 100).toFixed(1)
        },
        qualityMetrics: {
          lengthDiff: scenario2.perspective.content.length - scenario1.perspective.content.length,
          biasesDiff: scenario2.perspective.biases.length - scenario1.perspective.biases.length
        }
      }
    }

    console.log('\n✅ RESULTADO DA COMPARAÇÃO:')
    console.log(`💰 Economia: $${comparison.comparison.costSavings.absolute.toFixed(4)} (${comparison.comparison.costSavings.percentage}%)`)
    console.log(`⏱️  Tempo: ${comparison.comparison.timeImprovement.absolute}ms mais rápido (${comparison.comparison.timeImprovement.percentage}%)`)
    console.log(`📝 Tamanho: ${comparison.comparison.qualityMetrics.lengthDiff > 0 ? '+' : ''}${comparison.comparison.qualityMetrics.lengthDiff} caracteres`)
    console.log(`🎯 Vieses: ${comparison.comparison.qualityMetrics.biasesDiff > 0 ? '+' : ''}${comparison.comparison.qualityMetrics.biasesDiff} vieses detectados\n`)

    res.status(200).json(comparison)

  } catch (error) {
    console.error('Error in comparison test:', error)
    res.status(500).json({ error: error.message })
  }
}

async function testScenario({ topic, claudeModel, gptModel, label }) {
  const costs = {
    perspective: 0,
    filterSources: 0,
    reflectiveQuestion: 0
  }

  // 1. Buscar fontes (apenas 1 perspectiva para teste)
  const searchResult = await tavilyClient.search(`${topic} perspectiva técnica`, {
    maxResults: 10,
    includeAnswer: false
  })

  const sources = searchResult.results.slice(0, 3).map(r => ({
    title: r.title,
    url: r.url,
    type: 'midia',
    trustScore: 75
  }))

  const searchContext = searchResult.results.slice(0, 3)
    .map(r => `📄 Fonte: ${r.title}\nURL: ${r.url}\nConteúdo: ${r.content}`)
    .join('\n\n---\n\n')

  // 2. Filtrar fontes com GPT
  const filterStart = Date.now()
  const filterResponse = await openai.chat.completions.create({
    model: gptModel,
    messages: [{
      role: 'user',
      content: `Das seguintes fontes sobre "${topic}", quais são relevantes para uma análise técnica?\n\n${sources.map((s, i) => `[${i}] ${s.title}`).join('\n')}\n\nResponda apenas com os números separados por vírgula.`
    }],
    temperature: 0,
    max_tokens: 50
  })
  const filterTime = Date.now() - filterStart

  // Calcular custo GPT
  const gptPricing = gptModel === 'gpt-4o-mini'
    ? { input: 0.00015 / 1000, output: 0.0006 / 1000 }  // GPT-4o-mini
    : { input: 0.0015 / 1000, output: 0.002 / 1000 }     // GPT-3.5-turbo

  costs.filterSources = (
    filterResponse.usage.prompt_tokens * gptPricing.input +
    filterResponse.usage.completion_tokens * gptPricing.output
  )

  console.log(`  ✓ [${label}] Filtro de fontes (${gptModel}): $${costs.filterSources.toFixed(4)} em ${filterTime}ms`)

  // 3. Gerar perspectiva com Claude
  const perspectiveStart = Date.now()
  const perspectiveResponse = await anthropic.messages.create({
    model: claudeModel,
    max_tokens: 600,
    temperature: 0.5,
    system: 'Você é um analista imparcial especializado em análises técnicas.',
    messages: [{
      role: 'user',
      content: `Analise o tópico "${topic}" da perspectiva TÉCNICA, focando em dados e evidências científicas.

CONTEXTO DE FONTES:
${searchContext}

INSTRUÇÕES:
- Escreva 2-3 parágrafos focados e bem fundamentados
- Cite as fontes quando relevante
- Detecte possíveis vieses

FORMATO DE RESPOSTA OBRIGATÓRIO:
[ANÁLISE]
Seu texto aqui...

[VIESES]
- Viés 1: descrição
- Viés 2: descrição`
    }]
  })
  const perspectiveTime = Date.now() - perspectiveStart

  // Calcular custo Claude
  const claudePricing = claudeModel === 'claude-3-5-haiku-20241022'
    ? { input: 0.0008 / 1000, output: 0.004 / 1000 }      // Haiku 3.5
    : { input: 0.003 / 1000, output: 0.015 / 1000 }       // Sonnet 4

  costs.perspective = (
    perspectiveResponse.usage.input_tokens * claudePricing.input +
    perspectiveResponse.usage.output_tokens * claudePricing.output
  )

  console.log(`  ✓ [${label}] Perspectiva (${claudeModel}): $${costs.perspective.toFixed(4)} em ${perspectiveTime}ms`)

  // Parse resposta
  const generatedContent = perspectiveResponse.content[0].text
  let analysisText = generatedContent
  let biases = []

  if (generatedContent.includes('[VIESES]')) {
    const parts = generatedContent.split('[VIESES]')
    analysisText = parts[0].replace('[ANÁLISE]', '').trim()
    const biasesText = parts[1].trim()
    biases = biasesText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(bias => bias.length > 0)
  }

  // 4. Gerar pergunta reflexiva com GPT
  const questionStart = Date.now()
  const questionResponse = await openai.chat.completions.create({
    model: gptModel,
    messages: [{
      role: 'user',
      content: `Baseado nesta análise técnica sobre "${topic}":\n\n${analysisText.substring(0, 300)}\n\nGere UMA pergunta reflexiva que estimule pensamento crítico.`
    }],
    temperature: 0.8,
    max_tokens: 100
  })
  const questionTime = Date.now() - questionStart

  costs.reflectiveQuestion = (
    questionResponse.usage.prompt_tokens * gptPricing.input +
    questionResponse.usage.completion_tokens * gptPricing.output
  )

  console.log(`  ✓ [${label}] Pergunta reflexiva (${gptModel}): $${costs.reflectiveQuestion.toFixed(4)} em ${questionTime}ms`)

  const totalCost = costs.perspective + costs.filterSources + costs.reflectiveQuestion

  return {
    perspective: {
      type: 'tecnica',
      content: analysisText,
      biases: biases,
      sources: sources
    },
    reflectiveQuestion: questionResponse.choices[0].message.content.trim(),
    costs,
    totalCost
  }
}
