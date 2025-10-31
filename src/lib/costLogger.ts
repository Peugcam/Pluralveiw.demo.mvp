import { createClient } from '@supabase/supabase-js';
import type { AIModel, OperationType, PerspectiveType } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Logger de custos de API
 * Registra todas as chamadas de IA e seus custos
 */

interface LogCostParams {
  analysisId?: string;
  operationType: OperationType;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  perspectiveType?: PerspectiveType | null;
  success?: boolean;
  errorMessage?: string | null;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
}

interface LogPerspectiveParams {
  analysisId?: string;
  perspectiveType: PerspectiveType;
  usage: ClaudeUsage;
  model?: AIModel;
}

interface LogFilterParams {
  analysisId?: string;
  usage: OpenAIUsage;
  model?: AIModel;
}

type ModelPricing = Record<string, { input: number; output: number }>;

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
  }: LogCostParams): Promise<void> {
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
        });

      if (error) {
        console.error('[CostLogger] Erro ao salvar custo:', error);
      }
    } catch (err) {
      // Não deixar erro de logging quebrar a aplicação
      console.error('[CostLogger] Erro inesperado:', err);
    }
  },

  /**
   * Calcula custo de uma chamada OpenAI
   */
  calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: ModelPricing = {
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
    };

    const prices = pricing[model] || pricing['gpt-4o-mini'];
    return (inputTokens * prices.input) + (outputTokens * prices.output);
  },

  /**
   * Calcula custo de uma chamada Claude
   */
  calculateClaudeCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: ModelPricing = {
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
    };

    const prices = pricing[model] || pricing['claude-3-5-haiku-20241022'];
    return (inputTokens * prices.input) + (outputTokens * prices.output);
  },

  /**
   * Logger específico para análises de perspectivas (Claude)
   */
  async logPerspectiveAnalysis({
    analysisId,
    perspectiveType,
    usage,
    model = 'claude-3-5-haiku-20241022'
  }: LogPerspectiveParams): Promise<number> {
    const cost = this.calculateClaudeCost(
      model,
      usage.input_tokens,
      usage.output_tokens
    );

    await this.log({
      analysisId,
      operationType: 'perspective_generation',
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: cost,
      perspectiveType
    });

    return cost;
  },

  /**
   * Logger específico para filtro de fontes (GPT)
   */
  async logFilterSources({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }: LogFilterParams): Promise<number> {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await this.log({
      analysisId,
      operationType: 'source_filtering',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    });

    return cost;
  },

  /**
   * Logger específico para validação de alinhamento (GPT)
   */
  async logValidateAlignment({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }: LogFilterParams): Promise<number> {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await this.log({
      analysisId,
      operationType: 'bias_detection',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    });

    return cost;
  },

  /**
   * Logger específico para perguntas reflexivas (GPT)
   */
  async logReflectiveQuestions({
    analysisId,
    usage,
    model = 'gpt-4o-mini'
  }: LogFilterParams): Promise<number> {
    const cost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await this.log({
      analysisId,
      operationType: 'question_generation',
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      costUsd: cost
    });

    return cost;
  }
};
