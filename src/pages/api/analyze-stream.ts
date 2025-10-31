import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { tavily } from '@tavily/core';
import { LRUCache } from 'lru-cache';
import { temporalDetector } from '../../lib/temporalDetector';
import { trustScoreCalculator } from '../../lib/trustScoreCalculator';
import { analyzeRateLimiter } from '../../lib/rateLimit';
import { validateData, analyzeSchema } from '../../lib/validation';
import { optionalAuth } from '../../lib/auth';
import { costLogger } from '../../lib/costLogger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { PerspectiveType, TrustScore } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

const CACHE_TTL = 15 * 60 * 1000;

interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

interface SearchResultWithTrust extends SearchResult {
  trustScore: TrustScore;
}

interface PerspectiveConfig {
  name: PerspectiveType;
  focus: string;
  sources: string;
}

interface GeneratedPerspective {
  type: PerspectiveType;
  content: string;
  sources: Array<{
    title: string;
    url: string;
    trustScore: number;
    trustLevel: string;
    publishedDate: string | null;
  }>;
  biases: string[];
}

const searchCache = new LRUCache<string, SearchResult[]>({
  max: 100,
  ttl: CACHE_TTL,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

function getCacheKey(topic: string, perspectiveName: string, perspectiveFocus: string): string {
  return `${topic.toLowerCase().trim()}:${perspectiveName}:${perspectiveFocus}`.replace(/\s+/g, '_');
}

// Perspectivas configuradas
const perspectiveTypes: PerspectiveConfig[] = [
  {
    name: 'technical',
    focus: 'Análise técnica e científica baseada em dados, evidências empíricas e pesquisas.',
    sources: 'Artigos científicos, journals, publicações técnicas'
  },
  {
    name: 'popular',
    focus: 'Perspectiva do senso comum, como o tema é discutido popularmente e impacta o dia a dia das pessoas.',
    sources: 'Redes sociais, mídia popular, fóruns de discussão'
  },
  {
    name: 'institutional',
    focus: 'Posição de instituições oficiais, governos, ONGs e organizações reconhecidas.',
    sources: 'Documentos governamentais, relatórios de ONGs, posicionamentos oficiais'
  },
  {
    name: 'academic',
    focus: 'Visão acadêmica universitária, teorias estabelecidas e debates intelectuais.',
    sources: 'Papers acadêmicos, teses, publicações universitárias'
  },
  {
    name: 'conservative',
    focus: 'Argumentos baseados em tradição, cautela, preservação de valores tradicionais.',
    sources: 'Think tanks conservadores, publicações tradicionais'
  },
  {
    name: 'progressive',
    focus: 'Argumentos baseados em mudança social, inovação, justiça e equidade.',
    sources: 'Think tanks progressistas, movimentos sociais, publicações progressistas'
  }
];

// Função auxiliar para enviar eventos SSE
function sendSSE(res: NextApiResponse, event: string, data: any): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting
  if (!analyzeRateLimiter.middleware(req, res)) {
    return;
  }

  // Autenticação opcional
  await optionalAuth(req);

  try {
    // Validação de input
    const validation = validateData(analyzeSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error
      });
    }

    if (!validation.data) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Invalid data'
      });
    }

    const { topic } = validation.data;

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar evento de início
    sendSSE(res, 'start', { topic, totalPerspectives: perspectiveTypes.length });

    // Detectar termos temporais
    const temporalInfo = temporalDetector.detect(topic);

    if (temporalInfo && temporalInfo.detected) {
      sendSSE(res, 'temporal', {
        label: temporalInfo.label,
        enhancedQuery: temporalInfo.enhancedQuery
      });
    }

    // Criar análise no banco
    const analysisData: any = {
      topic: topic,
      status: 'processing'
    };

    if ((req as any).user && (req as any).user.id) {
      analysisData.user_id = (req as any).user.id;
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();

    if (analysisError) throw analysisError;

    sendSSE(res, 'analysis_created', { analysisId: analysis.id });

    // Gerar perspectivas e fazer streaming
    const perspectives: GeneratedPerspective[] = [];

    for (let i = 0; i < perspectiveTypes.length; i++) {
      const perspType = perspectiveTypes[i];

      // Enviar progresso
      sendSSE(res, 'progress', {
        current: i + 1,
        total: perspectiveTypes.length,
        perspective: perspType.name
      });

      try {
        // Buscar na web
        const cacheKey = getCacheKey(topic, perspType.name, perspType.focus);
        let searchResults = searchCache.get(cacheKey);

        if (!searchResults) {
          const queryToUse = temporalInfo?.enhancedQuery || topic;
          const searchResponse = await tavilyClient.search(queryToUse, {
            maxResults: 5,
            searchDepth: 'basic',
            includeAnswer: false,
          });
          searchResults = (searchResponse.results || []) as SearchResult[];
          searchCache.set(cacheKey, searchResults);
        }

        // Calcular Trust Score
        const resultsWithTrust: SearchResultWithTrust[] = searchResults.map(result => ({
          ...result,
          trustScore: trustScoreCalculator.calculate(result as any)
        }));

        // Preparar contexto para Claude
        const context = resultsWithTrust
          .slice(0, 5)
          .map((r, idx) =>
            `[${idx + 1}] ${r.title}\n${r.content}\nURL: ${r.url}\nTrust Score: ${r.trustScore.score}/100\n`
          )
          .join('\n');

        // Gerar análise com Claude
        const prompt = `Você é um analista especializado em fornecer perspectivas equilibradas sobre tópicos complexos.

TÓPICO: "${topic}"

PERSPECTIVA SOLICITADA: ${perspType.name.toUpperCase()}
FOCO: ${perspType.focus}
FONTES RECOMENDADAS: ${perspType.sources}

CONTEXTO (Resultados de pesquisa):
${context}

INSTRUÇÕES:
1. Forneça uma análise de 200-300 palavras desta perspectiva específica
2. Use evidências do contexto fornecido
3. Mantenha tom neutro e informativo
4. Cite fontes quando relevante
5. NÃO misture com outras perspectivas

IMPORTANTE: Após a análise, identifique 5 tipos de vieses potenciais:
1. Vieses ideológicos ou políticos
2. Conflitos de interesse (ex: financiamento)
3. Limitações metodológicas
4. Perspectivas sub-representadas
5. Suposições não questionadas

FORMATO DE RESPOSTA:
[ANÁLISE]
Sua análise aqui...

[VIESES]
1. [tipo de viés]: [descrição]
2. [tipo de viés]: [descrição]
...`;

        const completion = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = completion.content[0].type === 'text'
          ? completion.content[0].text
          : '';

        // Parse da resposta
        const analysisPart = responseText.split('[VIESES]')[0].replace('[ANÁLISE]', '').trim();
        const biasesPart = responseText.split('[VIESES]')[1] || '';

        const biases = biasesPart
          .split('\n')
          .filter(line => line.match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(b => b.length > 0);

        // Criar perspectiva
        const perspective: GeneratedPerspective = {
          type: perspType.name,
          content: analysisPart,
          sources: resultsWithTrust.slice(0, 3).map(r => ({
            title: r.title,
            url: r.url,
            trustScore: r.trustScore.score,
            trustLevel: r.trustScore.level,
            publishedDate: r.publishedDate || null
          })),
          biases: biases.length > 0 ? biases : ['Nenhum viés significativo detectado']
        };

        perspectives.push(perspective);

        // Log de custo
        await costLogger.log({
          analysisId: analysis.id,
          operationType: 'perspective_generation',
          model: 'claude-3-5-haiku-20241022',
          inputTokens: completion.usage.input_tokens,
          outputTokens: completion.usage.output_tokens,
          costUsd: costLogger.calculateClaudeCost(
            'claude-3-5-haiku-20241022',
            completion.usage.input_tokens,
            completion.usage.output_tokens
          ),
          perspectiveType: perspType.name
        });

        // Enviar perspectiva via SSE
        sendSSE(res, 'perspective', {
          index: i,
          perspective
        });

      } catch (error) {
        console.error(`Erro ao gerar perspectiva ${perspType.name}:`, error);
        sendSSE(res, 'error', {
          perspectiveIndex: i,
          perspectiveName: perspType.name,
          error: (error as Error).message
        });
      }
    }

    // Gerar perguntas reflexivas
    sendSSE(res, 'generating_questions', {});

    try {
      const questionsPrompt = `Baseado na análise multi-perspectiva sobre "${topic}", gere 5 perguntas reflexivas que:
1. Estimulem pensamento crítico
2. Explorem diferentes ângulos
3. Questionem suposições
4. Promovam diálogo construtivo
5. Sejam abertas (não sim/não)

Retorne apenas as perguntas, uma por linha, sem numeração.`;

      const questionsResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: questionsPrompt }],
        temperature: 0.8,
        max_tokens: 500
      });

      const questions = (questionsResponse.choices[0].message.content || '')
        .split('\n')
        .filter(q => q.trim().length > 0)
        .map(q => q.replace(/^[-•*]\s*/, '').trim())
        .slice(0, 5);

      // Log de custo
      await costLogger.log({
        analysisId: analysis.id,
        operationType: 'question_generation',
        model: 'gpt-4o-mini',
        inputTokens: questionsResponse.usage?.prompt_tokens || 0,
        outputTokens: questionsResponse.usage?.completion_tokens || 0,
        costUsd: costLogger.calculateOpenAICost(
          'gpt-4o-mini',
          questionsResponse.usage?.prompt_tokens || 0,
          questionsResponse.usage?.completion_tokens || 0
        )
      });

      // Enviar perguntas
      sendSSE(res, 'questions', { questions });

    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      sendSSE(res, 'error', { stage: 'questions', error: (error as Error).message });
    }

    // Salvar perspectivas no banco
    if (perspectives.length > 0) {
      const { error: perspError } = await supabase
        .from('perspectives')
        .insert(
          perspectives.map(p => ({
            analysis_id: analysis.id,
            type: p.type,
            content: p.content,
            sources: p.sources || [],
            biases: p.biases || []
          }))
        );

      if (perspError) {
        console.error('Erro ao salvar perspectivas:', perspError);
      }
    }

    // Atualizar status da análise
    await supabase
      .from('analyses')
      .update({ status: 'completed' })
      .eq('id', analysis.id);

    // Enviar evento de conclusão
    sendSSE(res, 'complete', {
      analysisId: analysis.id,
      perspectivesCount: perspectives.length
    });

    // Fechar conexão
    res.end();

  } catch (error) {
    console.error('Erro no streaming:', error);
    sendSSE(res, 'error', {
      stage: 'general',
      error: (error as Error).message
    });
    res.end();
  }
}
