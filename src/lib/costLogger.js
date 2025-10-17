import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Logger de custos de API
 * Registra todas as chamadas de IA e seus custos
 */
export const costLogger = {
  /**
   * Registra custo de uma operação
   */
  async log({
    analysisId,
    operationType,
    model,
    inputTokens,
    outputTokens,
    costUsd,
    perspectiveType = null,
    success = true,
    errorMessage = null
  }) {
    try {
      const { error } = await supabase
        .from('api_costs')
        .insert({
          analysis_id: analysisId,
          operation_type: operationType,
          model: model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          cost_usd: costUsd,
          perspective_type: perspectiveType,
          success: success,
          error_message: errorMessage
        })

      if (error) {
        console.error('[CostLogger] Erro ao salvar custo:', error)
      }
    } catch (err) {
      // Não deixar erro de logging quebrar a aplicação
      console.error('[CostLogger] Erro inesperado:', err)
    }
  },

  /**
   * Calcula custo de uma chamada OpenAI
   */
  calculateOpenAICost(model, inputTokens, outputTokens) {
    const pricing = {
      'gpt-4o-mini': {
        input: 0.00015 / 1000,  // $0.15 per 1M input tokens
        output: 0.0006 / 1000   // $0.60 per 1M output tokens
      },
      'gpt-3.5-turbo': {
        input: 0.0015 / 1000,  // $0.0015 per 1K input tokens
        output: 0.002 / 1000   // $0.002 per 1K output tokens
      },
      'gpt-4': {
        input: 0.03 / 1000,
        output: 0.06 / 1000
      }
    }

    const prices = pricing[model] || pricing['gpt-4o-mini']
    return (inputTokens * prices.input) + (outputTokens * prices.output)
  },

  /**
   * Calcula custo de uma chamada Claude
   */
  calculateClaudeCost(model, inputTokens, outputTokens) {
    const pricing = {
      'claude-3-5-haiku-20241022': {
        input: 0.0008 / 1000,  // $0.80 per 1M input tokens
        output: 0.004 / 1000   // $4 per 1M output tokens
      },
      'claude-sonnet-4-20250514': {
        input: 0.003 / 1000,   // $3 per 1M input tokens
        output: 0.015 / 1000   // $15 per 1M output tokens
      },
      'claude-3-haiku-20240307': {
        input: 0.00025 / 1000, // $0.25 per 1M input tokens
        output: 0.00125 / 1000 // $1.25 per 1M output tokens
      }
    }

    const prices = pricing[model] || pricing['claude-3-5-haiku-20241022']
    return (inputTokens * prices.input) + (outputTokens * prices.output)
  },

  /**
   * Logger específico para análises de perspectivas (Claude)
   */
  async logPerspectiveAnalysis({
    analysisId,
    perspectiveType,
    usage,
    model = 'claude-3-5-haiku-20241022'
  }) {
    const cost = this.calculateClaudeCost(
      model,
      usage.input_tokens,
      usage.output_tokens
    )

    await this.log({
      analysisId,
      operationType: 'perspective_analysis',
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: cost,
      perspectiveType
    })

    return cost
  },

  /**
   * Logger específico para filtro de fontes (GPT)
   */
  async logFilterSources({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }) {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    )

    await this.log({
      analysisId,
      operationType: 'filter_sources',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    })

    return cost
  },

  /**
   * Logger específico para validação de alinhamento (GPT)
   */
  async logValidateAlignment({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }) {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    )

    await this.log({
      analysisId,
      operationType: 'validate_alignment',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    })

    return cost
  },

  /**
   * Logger específico para perguntas reflexivas (GPT)
   */
  async logReflectiveQuestions({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }) {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    )

    await this.log({
      analysisId,
      operationType: 'reflective_questions',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    })

    return cost
  }
}
