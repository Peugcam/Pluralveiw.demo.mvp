import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { topic, perspectiveType = 'tecnica' } = req.body

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' })
  }

  // Definir perspectiva
  const perspectives = {
    tecnica: { name: 'Técnica', focus: 'aspectos técnicos, dados, evidências científicas' },
    popular: { name: 'Popular', focus: 'senso comum, impacto no dia a dia das pessoas' },
    academica: { name: 'Acadêmica', focus: 'teorias, pesquisas, visão científica e universitária' },
  }

  const perspective = perspectives[perspectiveType] || perspectives.tecnica

  // Prompt comum para ambos
  const prompt = `Você é um analista especializado em análise de múltiplas perspectivas.

TEMA EXATO A SER ANALISADO: "${topic}"
PERSPECTIVA A ANALISAR: ${perspective.name}
FOCO: ${perspective.focus}

INSTRUÇÕES IMPORTANTES:
- Mantenha o foco EXCLUSIVAMENTE no tema "${topic}"
- NÃO fuja do tema ou faça generalizações amplas
- Seja específico sobre "${topic}" sob a perspectiva ${perspective.name}
- Escreva 2-3 parágrafos focados e bem fundamentados

⚠️ DETECÇÃO DE VIESES - MUITO IMPORTANTE:
Após a análise, identifique EXPLICITAMENTE possíveis vieses:
- Vieses ideológicos ou políticos presentes
- Conflitos de interesse das fontes
- Limitações metodológicas evidentes
- Perspectivas sub-representadas ou ausentes

FORMATO DE RESPOSTA OBRIGATÓRIO:
[ANÁLISE]
Seu texto de 2-3 parágrafos aqui...

[VIESES]
- Viés 1: descrição
- Viés 2: descrição
(Se não houver vieses significativos, escreva "Nenhum viés significativo identificado")`

  try {
    console.log(`\n🔄 Testando GPT vs Claude para: "${topic}" (${perspective.name})`)

    const startTime = Date.now()

    // Executar ambos em paralelo
    const [gptResult, claudeResult] = await Promise.all([
      // GPT-3.5
      (async () => {
        const gptStart = Date.now()
        try {
          const completion = await openai.chat.completions.create({
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

          const gptTime = Date.now() - gptStart

          return {
            model: 'GPT-3.5-turbo',
            content: completion.choices[0].message.content,
            time: gptTime,
            tokens: {
              input: completion.usage.prompt_tokens,
              output: completion.usage.completion_tokens,
              total: completion.usage.total_tokens
            },
            cost: (completion.usage.prompt_tokens * 0.0015 / 1000) + (completion.usage.completion_tokens * 0.002 / 1000)
          }
        } catch (error) {
          return {
            model: 'GPT-3.5-turbo',
            error: error.message,
            time: Date.now() - gptStart
          }
        }
      })(),

      // Claude 3.5 Sonnet
      (async () => {
        const claudeStart = Date.now()
        try {
          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            temperature: 0.5,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })

          const claudeTime = Date.now() - claudeStart

          return {
            model: 'Claude Sonnet 4',
            content: message.content[0].text,
            time: claudeTime,
            tokens: {
              input: message.usage.input_tokens,
              output: message.usage.output_tokens,
              total: message.usage.input_tokens + message.usage.output_tokens
            },
            cost: (message.usage.input_tokens * 0.003 / 1000) + (message.usage.output_tokens * 0.015 / 1000)
          }
        } catch (error) {
          return {
            model: 'Claude Sonnet 4',
            error: error.message,
            time: Date.now() - claudeStart
          }
        }
      })()
    ])

    const totalTime = Date.now() - startTime

    console.log(`✅ Teste concluído em ${totalTime}ms`)
    console.log(`  GPT: ${gptResult.time}ms | ${gptResult.tokens?.total || 0} tokens | $${gptResult.cost?.toFixed(4) || 0}`)
    console.log(`  Claude: ${claudeResult.time}ms | ${claudeResult.tokens?.total || 0} tokens | $${claudeResult.cost?.toFixed(4) || 0}`)

    res.status(200).json({
      success: true,
      topic,
      perspective: perspective.name,
      totalTime,
      results: {
        gpt: gptResult,
        claude: claudeResult
      },
      comparison: {
        timeDiff: Math.abs(gptResult.time - claudeResult.time),
        fasterModel: gptResult.time < claudeResult.time ? 'GPT' : 'Claude',
        costDiff: Math.abs((gptResult.cost || 0) - (claudeResult.cost || 0)),
        cheaperModel: (gptResult.cost || 0) < (claudeResult.cost || 0) ? 'GPT' : 'Claude'
      }
    })

  } catch (error) {
    console.error('Error in test:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
