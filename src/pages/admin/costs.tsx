import { useState, useEffect } from 'react';
import type { CostStatsResponse } from '@/types';

type Period = '24h' | '7d' | '30d' | '90d';

interface PeriodOption {
  value: Period;
  label: string;
}

const operationLabels: Record<string, string> = {
  perspective_analysis: 'Análise de Perspectivas',
  perspective_generation: 'Geração de Perspectivas',
  filter_sources: 'Filtro de Fontes',
  source_filtering: 'Filtro de Fontes',
  validate_alignment: 'Validação de Alinhamento',
  bias_detection: 'Detecção de Vieses',
  reflective_questions: 'Perguntas Reflexivas',
  question_generation: 'Geração de Perguntas'
};

export default function CostsDashboard() {
  const [stats, setStats] = useState<CostStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('7d');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cost-stats?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar estatísticas');
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const periodOptions: PeriodOption[] = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">💰 Dashboard de Custos de API</h1>
          <p className="text-gray-400">Monitoramento em tempo real de gastos com IA</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {periodOptions.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p.value
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-gray-400 mt-4">Carregando estatísticas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8 text-red-200">
            ⚠️ {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-lg p-6">
                <div className="text-sm text-blue-300 mb-1">Custo Total</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(stats.totalCost)}
                </div>
                {stats.trend && stats.trend.change !== 0 && (
                  <div className={`text-xs ${stats.trend.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatPercent(stats.trend.change)} vs período anterior
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-lg p-6">
                <div className="text-sm text-purple-300 mb-1">Total de Requisições</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatNumber(stats.totalRequests)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 rounded-lg p-6">
                <div className="text-sm text-green-300 mb-1">Custo Médio</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(stats.averageCostPerRequest)}
                </div>
                <div className="text-xs text-gray-400">por operação</div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-500/30 rounded-lg p-6">
                <div className="text-sm text-orange-300 mb-1">Tendência</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stats.trend?.direction === 'up' ? '📈' : stats.trend?.direction === 'down' ? '📉' : '➡️'}
                </div>
                <div className="text-xs text-gray-400">
                  {stats.trend?.direction === 'up' ? 'Aumentando' : stats.trend?.direction === 'down' ? 'Diminuindo' : 'Estável'}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Cost by Model */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">💡 Custo por Modelo</h3>
                <div className="space-y-3">
                  {stats.byModel.map((item) => {
                    const percentage = (item.totalCost / stats.totalCost) * 100;
                    return (
                      <div key={item.model}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{item.model}</span>
                          <span className="text-white font-semibold">{formatCurrency(item.totalCost)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.requests} operações • {item.percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost by Operation */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">⚙️ Custo por Operação</h3>
                <div className="space-y-3">
                  {stats.byOperation.map((item) => {
                    const percentage = (item.totalCost / stats.totalCost) * 100;
                    return (
                      <div key={item.operation}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{operationLabels[item.operation] || item.operation}</span>
                          <span className="text-white font-semibold">{formatCurrency(item.totalCost)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.requests} operações
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Expensive Analyses */}
            {stats.topAnalyses && stats.topAnalyses.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">🔥 Análises Mais Caras</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                        <th className="pb-3">#</th>
                        <th className="pb-3">Tópico</th>
                        <th className="pb-3 text-right">Custo</th>
                        <th className="pb-3 text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topAnalyses.map((analysis, idx) => (
                        <tr key={analysis.id} className="border-b border-gray-700/50">
                          <td className="py-3 text-gray-500">{idx + 1}</td>
                          <td className="py-3 text-gray-300">{analysis.topic}</td>
                          <td className="py-3 text-right text-white font-semibold">
                            {formatCurrency(analysis.cost)}
                          </td>
                          <td className="py-3 text-right text-gray-400">
                            {new Date(analysis.date).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
