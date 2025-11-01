import Anthropic from '@anthropic-ai/sdk';
import { costLogger } from './costLogger';
import type { PerspectiveType } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 🔥 PROMPT CACHING - Economia de 90% nos custos!
 *
 * System prompts fixos são cacheados por 5 minutos
 * Primeira chamada: $3.75/1M write + $0.80/1M read
 * Próximas chamadas (5 min): $0.30/1M read (90% economia!)
 */

// System prompt fixo (será cacheado automaticamente)
const BASE_SYSTEM_PROMPT = `Você é um analista especializado em análise de múltiplas perspectivas.

SUAS COMPETÊNCIAS:
- Análise imparcial e objetiva de tópicos complexos
- Identificação precisa de vieses ideológicos, metodológicos e de representação
- Integração natural de fontes verificadas no texto
- Foco estrito no tema solicitado, sem generalizações

PRINCÍPIOS DE ANÁLISE:
1. PRECISÃO: Mantenha-se exclusivamente no tema específico
2. FUNDAMENTAÇÃO: Cite fontes explicitamente ("Segundo X...", "De acordo com Y...")
3. OBJETIVIDADE: Apresente fatos antes de interpretações
4. TRANSPARÊNCIA: Identifique claramente vieses e limitações
5. CONTEXTUALIZAÇÃO: Considere diferentes perspectivas antes de concluir

ESTRUTURA DE VIESES:
Identifique explicitamente:
- 🎭 Vieses ideológicos ou políticos
- 💰 Conflitos de interesse (financiamento, patrocínio)
- 📊 Limitações metodológicas (amostras, dados selecionados)
- 👥 Perspectivas sub-representadas
- 💭 Suposições não questionadas

QUALIDADE ESPERADA:
- Textos de 2-3 parágrafos bem desenvolvidos
- Integração natural de dados e fontes
- Linguagem clara e acessível
- Análise profunda mas concisa`;

interface GeneratePerspectiveParams {
  topic: string;
  perspectiveType: PerspectiveType;
  perspectiveName: string;
  perspectiveFocus: string;
  searchContext: string;
  temporalContext?: string;
  analysisId?: string;
}

interface BiasItem {
  type: 'ideological' | 'conflict_of_interest' | 'methodological' | 'representation' | 'assumption';
  description: string;
}

/**
 * Gera perspectiva usando Prompt Caching para economia de 90%
 */
export async function generatePerspectiveWithCaching({
  topic,
  perspectiveType,
  perspectiveName,
  perspectiveFocus,
  searchContext,
  temporalContext = '',
  analysisId
}: GeneratePerspectiveParams) {

  // Contexto dinâmico (muda por análise, mas também pode ser cacheado se houver múltiplas perspectivas)
  const dynamicContext = `${temporalContext}

CONTEXTO DE FONTES REAIS ENCONTRADAS:
${searchContext || 'Nenhum contexto específico encontrado. Use seu conhecimento geral.'}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 800,
      temperature: 0.5,

      // 🔥 PROMPT CACHING: System prompt fixo
      system: [
        {
          type: 'text',
          text: BASE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }  // Cacheia por 5 minutos
        },
        {
          type: 'text',
          text: dynamicContext,
          cache_control: { type: 'ephemeral' }  // Também cacheia contexto de fontes
        }
      ],

      messages: [
        {
          role: 'user',
          content: `TEMA EXATO A SER ANALISADO: "${topic}"

PERSPECTIVA A ANALISAR: ${perspectiveName}
FOCO: ${perspectiveFocus}

INSTRUÇÕES:
1. Mantenha o foco EXCLUSIVAMENTE no tema "${topic}"
2. CITE EXPLICITAMENTE as fontes fornecidas quando relevantes
3. Use expressões como: "Segundo [fonte]...", "De acordo com...", "Dados mostram que..."
4. Escreva 2-3 parágrafos focados e bem fundamentados
5. Priorize informações das fontes fornecidas

FORMATO DE RESPOSTA OBRIGATÓRIO:
[ANÁLISE]
Seu texto de 2-3 parágrafos aqui...

[VIESES]
- Viés 1: descrição
- Viés 2: descrição
(Se não houver vieses significativos, escreva "Nenhum viés significativo identificado")`
        }
      ]
    });

    const generatedContent = response.content[0].text;

    // 💰 LOG de custo com informação de cache
    if (analysisId) {
      const usage = response.usage as any;

      // Anthropic retorna cache hits/misses no usage
      console.log(`[Cache Stats] ${perspectiveName}:`, {
        input_tokens: usage.input_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
        cache_read_input_tokens: usage.cache_read_input_tokens || 0,
        output_tokens: usage.output_tokens
      });

      await costLogger.logPerspectiveAnalysis({
        analysisId: analysisId,
        perspectiveType: perspectiveType,
        usage: {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens
        },
        model: 'claude-3-5-haiku-20241022'
      });
    }

    // 🔍 PARSING: Separar análise e vieses
    let analysisText = generatedContent;
    let biases: string[] = [];

    if (generatedContent.includes('[VIESES]')) {
      const parts = generatedContent.split('[VIESES]');
      analysisText = parts[0].replace('[ANÁLISE]', '').trim();

      const biasesText = parts[1].trim();

      // Extrair vieses da lista
      biases = biasesText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())
        .filter(bias => bias.length > 0);

      // Log de vieses detectados
      if (biases.length > 0 && !biases[0].toLowerCase().includes('nenhum')) {
        console.log(`[${perspectiveName}] 🎯 ${biases.length} viese(s) detectado(s)`);
      }
    } else {
      console.warn(`[${perspectiveName}] ⚠️ Formato de resposta não incluiu seção [VIESES]`);
    }

    return {
      content: analysisText,
      biases: biases
    };

  } catch (error) {
    console.error(`Error generating perspective ${perspectiveName}:`, error);
    throw error;
  }
}

/**
 * 🎯 STRUCTURED OUTPUTS com Tool Use
 * Garante formato JSON consistente, eliminando parsing errors
 */
export async function generatePerspectiveStructured({
  topic,
  perspectiveType,
  perspectiveName,
  perspectiveFocus,
  searchContext,
  temporalContext = '',
  analysisId
}: GeneratePerspectiveParams) {

  // Schema para structured output
  const perspectiveSchema = {
    name: 'generate_perspective',
    description: 'Generate a multi-perspective analysis with bias detection',
    input_schema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'string',
          description: 'Main analysis content (2-3 well-developed paragraphs, 200-400 words)'
        },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 key takeaways from the analysis'
        },
        biases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['ideological', 'conflict_of_interest', 'methodological', 'representation', 'assumption'],
                description: 'Type of bias detected'
              },
              description: {
                type: 'string',
                description: 'Clear explanation of the bias'
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'How significant this bias is'
              }
            },
            required: ['type', 'description', 'severity']
          },
          description: 'Identified biases in the analysis or sources'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence score (0-1) in the analysis quality'
        },
        sourcesCited: {
          type: 'integer',
          description: 'Number of sources explicitly cited in the analysis'
        }
      },
      required: ['analysis', 'keyPoints', 'biases', 'confidence', 'sourcesCited']
    }
  };

  const dynamicContext = `${temporalContext}

CONTEXTO DE FONTES REAIS:
${searchContext || 'Nenhum contexto específico encontrado.'}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1200,
      temperature: 0.5,

      // 🔥 System prompt cacheado
      system: [
        {
          type: 'text',
          text: BASE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: dynamicContext,
          cache_control: { type: 'ephemeral' }
        }
      ],

      // 🎯 Tool use para structured output
      tools: [perspectiveSchema],
      tool_choice: { type: 'tool', name: 'generate_perspective' },

      messages: [
        {
          role: 'user',
          content: `Analyze "${topic}" from the ${perspectiveName} perspective.

FOCUS: ${perspectiveFocus}

REQUIREMENTS:
1. Stay strictly on topic: "${topic}"
2. CITE sources explicitly with phrases like "According to [source]..."
3. Write 2-3 well-developed paragraphs
4. Identify ALL potential biases (ideological, financial, methodological, etc.)
5. Provide 3-5 key takeaways
6. Rate your confidence in this analysis (0-1)
7. Count how many sources you cited`
        }
      ]
    });

    // Extrair structured output
    const toolUse = response.content.find(c => c.type === 'tool_use') as any;

    if (!toolUse) {
      throw new Error('No tool use in response');
    }

    const result = toolUse.input;

    // 💰 LOG de custo
    if (analysisId) {
      const usage = response.usage as any;

      console.log(`[Structured] ${perspectiveName}:`, {
        cache_hit: usage.cache_read_input_tokens > 0,
        biases_detected: result.biases.length,
        sources_cited: result.sourcesCited,
        confidence: result.confidence
      });

      await costLogger.logPerspectiveAnalysis({
        analysisId: analysisId,
        perspectiveType: perspectiveType,
        usage: {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens
        },
        model: 'claude-3-5-haiku-20241022'
      });
    }

    // Converter biases estruturados para formato antigo (compatibilidade)
    const biasesFormatted = result.biases.map((b: BiasItem) =>
      `${b.type}: ${b.description} (${b.severity})`
    );

    return {
      content: result.analysis,
      biases: biasesFormatted,
      keyPoints: result.keyPoints,
      confidence: result.confidence,
      sourcesCited: result.sourcesCited,
      structuredBiases: result.biases  // Dados estruturados completos
    };

  } catch (error) {
    console.error(`Error generating structured perspective ${perspectiveName}:`, error);
    throw error;
  }
}
