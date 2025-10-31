import { createClient } from '@supabase/supabase-js';
import { apiRateLimiter } from '../../../lib/rateLimit';
import { validateData, analysisIdSchema } from '../../../lib/validation';
import { optionalAuth } from '../../../lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { APIError } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalysisResponse {
  analysis: any;
  perspectives: any[];
  questions: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse | APIError>
) {
  if (req.method !== 'GET') {
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
    const validation = validateData(analysisIdSchema, req.query);
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

    const { id } = validation.data;

    // Buscar análise
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (analysisError) throw analysisError;
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found', statusCode: 404 });
    }

    // Buscar perspectivas
    const { data: perspectives, error: perspectivesError } = await supabase
      .from('perspectives')
      .select('*')
      .eq('analysis_id', id)
      .order('type');

    if (perspectivesError) throw perspectivesError;

    // Buscar perguntas reflexivas
    const { data: questions, error: questionsError } = await supabase
      .from('reflective_questions')
      .select('*')
      .eq('analysis_id', id);

    if (questionsError) throw questionsError;

    res.status(200).json({
      analysis,
      perspectives: perspectives || [],
      questions: questions || []
    });

  } catch (error) {
    // Log de erro sem expor detalhes sensíveis
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching analysis:', error);
    } else {
      console.error('Error fetching analysis:', (error as Error).message);
    }

    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'Erro ao buscar análise',
      statusCode: 500
    });
  }
}
