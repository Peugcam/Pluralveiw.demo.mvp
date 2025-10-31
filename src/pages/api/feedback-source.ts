import { createClient } from '@supabase/supabase-js';
import { feedbackRateLimiter } from '../../lib/rateLimit';
import { validateData, feedbackSourceSchema } from '../../lib/validation';
import { optionalAuth } from '../../lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { APIError } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse | APIError>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', statusCode: 405 });
  }

  // Rate Limiting
  if (!feedbackRateLimiter.middleware(req, res)) {
    return; // Rate limit exceeded
  }

  // Autenticação opcional
  await optionalAuth(req);

  try {
    // Validação de input
    const validation = validateData(feedbackSourceSchema, req.body);
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

    const { analysisId, perspectiveType, sourceUrl, feedback } = validation.data;

    // Salvar feedback no banco
    const { data, error } = await supabase
      .from('source_feedback')
      .insert({
        analysis_id: analysisId,
        perspective_type: perspectiveType,
        source_url: sourceUrl,
        feedback: feedback,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving feedback:', error);
      }
      throw error;
    }

    // Log sem dados sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Feedback] ${feedback} - ${perspectiveType}`);
    }

    res.status(200).json({
      success: true,
      message: 'Feedback recebido com sucesso',
      data
    });

  } catch (error) {
    // Log de erro sem expor detalhes sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in feedback-source API:', error);
    } else {
      console.error('Error in feedback-source API:', (error as Error).message);
    }

    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'Erro ao processar feedback',
      statusCode: 500
    });
  }
}
