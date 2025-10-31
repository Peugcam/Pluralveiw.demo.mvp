import OpenAI from 'openai';
import { apiRateLimiter } from '../../lib/rateLimit';
import { validateData, comparePerspectivesSchema } from '../../lib/validation';
import { optionalAuth } from '../../lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { APIError, ComparePerspectivesResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos timeout
});

interface ComparisonResult {
  consensus: string[];
  divergences: string[];
  contradictions: string[];
  synthesis: string;
}

interface SuccessResponse extends ComparePerspectivesResponse {
  success: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | APIError>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', statusCode: 405 });
  }

  // Rate Limiting
  if (!apiRateLimiter.middleware(req, res)) {
    return; // Rate limit exceeded
  }

  // Autenticação opcional
  await optionalAuth(req);

  try {
    // Validação de input
    const validation = validateData(comparePerspectivesSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error,
        statusCode: 400
      });
    }

    if (!validation.data) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Invalid data',
        statusCode: 400
      });
    }

    const { perspectives, topic } = validation.data;

    // Formatar perspectivas para análise
    const perspectivesText = perspectives.map((p: any) =>
      `[${p.type.toUpperCase()}]\n${p.content}`
    ).join('\n\n---\n\n');

    const prompt = `Você é um analista especializado em síntese e comparação de múltiplas perspectivas.

TEMA: "${topic}"

PERSPECTIVAS A COMPARAR:
${perspectivesText}

TAREFA:
Analise estas ${perspectives.length} perspectivas e identifique:

1. PONTOS EM COMUM (consensos entre as perspectivas)
2. DIVERGÊNCIAS PRINCIPAIS (onde discordam)
3. CONTRADIÇÕES DIRETAS (afirmações opostas)
4. SÍNTESE (visão integrada considerando todas as perspectivas)

FORMATO DE RESPOSTA OBRIGATÓRIO:

[CONSENSOS]
- Consenso 1: descrição
- Consenso 2: descrição
(Se não houver consensos, escreva "Nenhum consenso significativo identificado")

[DIVERGÊNCIAS]
- Divergência 1: descrição (Perspectiva X diz... vs Perspectiva Y diz...)
- Divergência 2: descrição
(Se não houver divergências, escreva "Nenhuma divergência significativa")

[CONTRADIÇÕES]
- Contradição 1: descrição específica do conflito
- Contradição 2: descrição
(Se não houver contradições diretas, escreva "Nenhuma contradição direta")

[SÍNTESE]
Um parágrafo integrando as perspectivas, destacando a complexidade do tema e como cada visão contribui para o entendimento completo.

IMPORTANTE:
- Seja específico e cite as perspectivas pelo nome
- Identifique apenas divergências/contradições REAIS (não invente)
- Na síntese, busque uma visão equilibrada que honre todas as perspectivas`;

    console.log('[Compare] Analisando comparação entre perspectivas...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista imparcial especializado em identificar padrões, consensos e divergências entre múltiplas perspectivas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Baixa temperatura para análise mais factual
      max_tokens: 800
    });

    const response = completion.choices[0].message.content || '';

    // Parse da resposta
    const comparison = parseComparisonResponse(response);

    console.log('[Compare] Análise concluída:', {
      consensos: comparison.consensus.length,
      divergências: comparison.divergences.length,
      contradições: comparison.contradictions.length
    });

    res.status(200).json({
      success: true,
      comparison: {
        selectedPerspectives: perspectives.map((p: any) => p.type),
        consensus: comparison.consensus,
        divergences: comparison.divergences,
        contradictions: comparison.contradictions,
        synthesis: comparison.synthesis
      }
    });

  } catch (error) {
    // Log de erro sem expor detalhes sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in compare-perspectives API:', error);
    } else {
      console.error('Error in compare-perspectives API:', (error as Error).message);
    }

    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'Erro ao comparar perspectivas',
      statusCode: 500
    });
  }
}

/**
 * Parse da resposta estruturada da IA
 */
function parseComparisonResponse(response: string): ComparisonResult {
  const result: ComparisonResult = {
    consensus: [],
    divergences: [],
    contradictions: [],
    synthesis: ''
  };

  try {
    // Extrair seção de CONSENSOS
    if (response.includes('[CONSENSOS]')) {
      const consensusSection = extractSection(response, '[CONSENSOS]', '[DIVERGÊNCIAS]');
      result.consensus = extractListItems(consensusSection);
    }

    // Extrair seção de DIVERGÊNCIAS
    if (response.includes('[DIVERGÊNCIAS]')) {
      const divergencesSection = extractSection(response, '[DIVERGÊNCIAS]', '[CONTRADIÇÕES]');
      result.divergences = extractListItems(divergencesSection);
    }

    // Extrair seção de CONTRADIÇÕES
    if (response.includes('[CONTRADIÇÕES]')) {
      const contradictionsSection = extractSection(response, '[CONTRADIÇÕES]', '[SÍNTESE]');
      result.contradictions = extractListItems(contradictionsSection);
    }

    // Extrair SÍNTESE
    if (response.includes('[SÍNTESE]')) {
      const synthesisStart = response.indexOf('[SÍNTESE]') + '[SÍNTESE]'.length;
      result.synthesis = response.substring(synthesisStart).trim();
    }

  } catch (error) {
    console.error('Error parsing comparison response:', error);
    // Fallback: retornar resposta bruta
    result.synthesis = response;
  }

  return result;
}

/**
 * Extrai uma seção entre dois marcadores
 */
function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const startIndex = text.indexOf(startMarker) + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, startIndex) : text.length;

  if (startIndex === -1 || (endMarker && endIndex === -1)) {
    return '';
  }

  return text.substring(startIndex, endIndex).trim();
}

/**
 * Extrai itens de lista (começando com "-")
 */
function extractListItems(text: string): string[] {
  return text
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().substring(1).trim())
    .filter(item => item.length > 0 && !item.toLowerCase().includes('nenhum'));
}
