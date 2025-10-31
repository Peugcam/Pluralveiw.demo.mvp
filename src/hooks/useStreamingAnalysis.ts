import { useState, useCallback } from 'react';
import type { UseStreamingAnalysisReturn, PerspectiveResponse } from '@/types';

/**
 * Hook para análise com streaming SSE
 */
export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [perspectives, setPerspectives] = useState<PerspectiveResponse[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [totalPerspectives, setTotalPerspectives] = useState<number>(6);
  const [data, setData] = useState<any>(null);

  const startAnalysis = useCallback(async (topic: string): Promise<void> => {
    // Reset state
    setLoading(true);
    setError(null);
    setPerspectives([]);
    setQuestions([]);
    setProgress(0);
    setData(null);

    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar análise');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream reader não disponível');
      }

      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setLoading(false);
          setProgress(100);
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Processar eventos SSE no buffer
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Manter última linha incompleta

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Parse SSE format
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);

            if (!eventMatch || !dataMatch) continue;

            const event = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);

            // Processar eventos
            switch (event) {
              case 'start':
                setTotalPerspectives(eventData.totalPerspectives);
                break;

              case 'temporal':
                console.log('Temporal query detected:', eventData);
                break;

              case 'analysis_created':
                console.log('Analysis created:', eventData.analysisId);
                break;

              case 'progress':
                setProgress((eventData.current / eventData.total) * 90); // 90% para perspectivas
                break;

              case 'perspective':
                setPerspectives(prev => {
                  const newPerspectives = [...prev];
                  newPerspectives[eventData.index] = eventData.perspective;
                  return newPerspectives;
                });
                break;

              case 'generating_questions':
                setProgress(95);
                break;

              case 'questions':
                setQuestions(eventData.questions);
                break;

              case 'complete':
                setProgress(100);
                setLoading(false);
                setData({
                  analysisId: eventData.analysisId,
                  topic: topic,
                  perspectives: perspectives,
                  questions: questions
                });
                break;

              case 'error':
                console.error('SSE Error:', eventData);
                setError(new Error(eventData.error || 'Erro desconhecido'));
                break;

              default:
                console.log('Unknown event:', event, eventData);
            }
          } catch (parseError) {
            console.error('Error parsing SSE event:', parseError);
          }
        }
      }

    } catch (err) {
      console.error('Stream error:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setLoading(false);
      setProgress(0);
    }
  }, [perspectives, questions]);

  const reset = useCallback(() => {
    setPerspectives([]);
    setQuestions([]);
    setError(null);
    setProgress(0);
    setLoading(false);
    setData(null);
  }, []);

  return {
    data,
    error,
    isLoading: loading,
    startAnalysis,
    // Campos adicionais para compatibilidade
    reset,
    progress,
    perspectives,
    questions,
    totalPerspectives
  };
}
