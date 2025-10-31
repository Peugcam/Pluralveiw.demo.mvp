import { useState } from 'react';
import { exportAnalysisToPDF, exportComparisonToPDF } from '../lib/pdfExporter';
import type { ExportButtonProps } from '@/types';
import type { PerspectiveResponse, PerspectiveComparison } from '@/types';

interface Analysis {
  topic: string;
  perspectives: PerspectiveResponse[];
  questions: string[];
}

interface ExportButtonComponentProps extends Partial<ExportButtonProps> {
  analysis?: Analysis | null;
  comparison?: PerspectiveComparison | null;
  type?: 'analysis' | 'comparison';
  label?: string;
  className?: string;
}

/**
 * Componente de botão para exportar análises para PDF
 */
export default function ExportButton({
  analysis = null,
  comparison = null,
  type = 'analysis',
  label = 'Exportar PDF',
  className = ''
}: ExportButtonComponentProps) {
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      let filename: string = '';

      if (type === 'analysis' && analysis) {
        const result = await exportAnalysisToPDF(analysis) as unknown as string;
        filename = result;
      } else if (type === 'comparison' && comparison && analysis?.perspectives) {
        const result = await exportComparisonToPDF(comparison, analysis.perspectives) as unknown as string;
        filename = result;
      } else {
        throw new Error('Dados insuficientes para exportação');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      console.log(`PDF exportado: ${filename}`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setTimeout(() => setError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  const defaultClassName = `
    px-6 py-3 rounded-lg font-semibold transition-all
    flex items-center gap-2 justify-center
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const statusClassName = success
    ? 'bg-green-500 hover:bg-green-600'
    : error
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700';

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={exporting || !analysis}
        className={`${defaultClassName} ${statusClassName} ${className}`}
        title={
          !analysis
            ? 'Nenhuma análise disponível'
            : 'Exportar análise como PDF'
        }
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Gerando PDF...</span>
          </>
        ) : success ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>PDF Gerado!</span>
          </>
        ) : error ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Erro ao exportar</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500 text-white text-xs p-2 rounded shadow-lg z-10">
          {error}
        </div>
      )}
    </div>
  );
}
