import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { PerspectiveRadarChartProps, PerspectiveResponse, Source } from '@/types';

type MetricType = 'trustScore' | 'biasCount' | 'sourceCount' | 'complexity';

interface ChartProps extends PerspectiveRadarChartProps {
  metric?: MetricType;
}

interface ChartData {
  perspective: string;
  value: number;
  fullData: PerspectiveResponse;
}

interface TooltipPayload {
  payload: ChartData;
}

/**
 * Componente de Radar Chart para visualizar comparação de perspectivas
 */
export default function PerspectiveRadarChart({ perspectives = [], metric = 'trustScore' }: ChartProps) {
  if (!perspectives || perspectives.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Nenhuma perspectiva disponível
      </div>
    );
  }

  // Labels das perspectivas
  const perspectiveLabels: Record<string, string> = {
    technical: 'Técnica',
    popular: 'Popular',
    institutional: 'Institucional',
    academic: 'Acadêmica',
    conservative: 'Conservadora',
    progressive: 'Progressista'
  };

  // Calcular métricas para cada perspectiva
  const calculateMetric = (perspective: PerspectiveResponse): number => {
    switch (metric) {
      case 'trustScore':
        // Média dos trust scores das fontes
        if (!perspective.sources || perspective.sources.length === 0) return 50;
        const avgTrust = perspective.sources.reduce((sum: number, s: Source) => sum + (s.trust_score || 50), 0) / perspective.sources.length;
        return Math.round(avgTrust);

      case 'biasCount':
        // Inverter contagem de vieses (menos vieses = melhor)
        const biasCount = perspective.biasDetected?.types?.length || 0;
        return Math.max(0, 100 - (biasCount * 20));

      case 'sourceCount':
        // Quantidade de fontes (normalizado para 0-100)
        const sourceCount = perspective.sources?.length || 0;
        return Math.min(100, sourceCount * 25);

      case 'complexity':
        // Complexidade baseada no tamanho do conteúdo
        const wordCount = perspective.content?.split(' ').length || 0;
        return Math.min(100, (wordCount / 300) * 100);

      default:
        return 50;
    }
  };

  // Preparar dados para o gráfico
  const data: ChartData[] = perspectives.map(p => ({
    perspective: perspectiveLabels[p.type] || p.type,
    value: calculateMetric(p),
    fullData: p
  }));

  // Labels das métricas
  const metricLabels: Record<MetricType, string> = {
    trustScore: 'Confiabilidade das Fontes',
    biasCount: 'Equilíbrio (menos vieses)',
    sourceCount: 'Quantidade de Fontes',
    complexity: 'Complexidade da Análise'
  };

  // Cores baseadas no tipo de perspectiva
  const getColor = (perspType: string): string => {
    const colors: Record<string, string> = {
      'Técnica': '#3b82f6',      // blue
      'Popular': '#10b981',       // green
      'Institucional': '#8b5cf6', // purple
      'Acadêmica': '#6366f1',     // indigo
      'Conservadora': '#f59e0b',  // orange
      'Progressista': '#ec4899'   // pink
    };
    return colors[perspType] || '#6b7280';
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const color = getColor(data.perspective);

    return (
      <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-lg">
        <p className="font-bold mb-1" style={{ color }}>
          {data.perspective}
        </p>
        <p className="text-sm text-gray-300">
          {metricLabels[metric as MetricType]}: <span className="font-semibold">{data.value}/100</span>
        </p>
        {metric === 'trustScore' && data.fullData.sources && (
          <p className="text-xs text-gray-400 mt-1">
            {data.fullData.sources.length} fonte(s)
          </p>
        )}
        {metric === 'biasCount' && data.fullData.biasDetected && (
          <p className="text-xs text-gray-400 mt-1">
            {data.fullData.biasDetected.types?.length || 0} viés(es) detectado(s)
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          📊 Comparação Visual de Perspectivas
        </h3>
        <p className="text-sm text-gray-400">
          Métrica: {metricLabels[metric as MetricType]}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid stroke="#ffffff20" />
          <PolarAngleAxis
            dataKey="perspective"
            tick={{ fill: '#fff', fontSize: 12 }}
            stroke="#ffffff40"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#ffffff60', fontSize: 10 }}
            stroke="#ffffff20"
          />
          <Radar
            name={metricLabels[metric as MetricType]}
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legenda de cores */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getColor(item.perspective) }}
            />
            <span className="text-gray-300">
              {item.perspective}: {item.value}/100
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
