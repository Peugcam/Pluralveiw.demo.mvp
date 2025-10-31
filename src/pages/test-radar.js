import { useState } from 'react'
import PerspectiveRadarChart from '../components/PerspectiveRadarChart'
import SEO from '../components/SEO'

export default function TestRadar() {
  const [metric, setMetric] = useState('trustScore')

  // Dados de exemplo (simula resultado de uma análise)
  const examplePerspectives = [
    {
      type: 'tecnica',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      sources: [
        { title: 'Nature Journal', url: 'https://nature.com/article1', trustScore: 95 },
        { title: 'Science Direct', url: 'https://sciencedirect.com/article2', trustScore: 90 },
        { title: 'IEEE Xplore', url: 'https://ieee.org/article3', trustScore: 92 }
      ],
      biases: ['Viés de confirmação científica', 'Limitação metodológica']
    },
    {
      type: 'popular',
      content: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      sources: [
        { title: 'Reddit Discussion', url: 'https://reddit.com/post1', trustScore: 60 },
        { title: 'Twitter Thread', url: 'https://twitter.com/thread1', trustScore: 55 }
      ],
      biases: ['Viés de popularidade', 'Falta de verificação', 'Simplificação excessiva']
    },
    {
      type: 'institucional',
      content: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      sources: [
        { title: 'Government Report', url: 'https://gov.br/report1', trustScore: 85 },
        { title: 'UN Document', url: 'https://un.org/doc1', trustScore: 88 },
        { title: 'WHO Statement', url: 'https://who.int/statement1', trustScore: 90 }
      ],
      biases: ['Viés institucional', 'Conflito de interesse político']
    },
    {
      type: 'academica',
      content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      sources: [
        { title: 'Academic Paper 1', url: 'https://scholar.google.com/paper1', trustScore: 93 },
        { title: 'University Research', url: 'https://university.edu/research1', trustScore: 91 },
        { title: 'Journal Article', url: 'https://journal.com/article1', trustScore: 89 },
        { title: 'Thesis', url: 'https://thesis.com/doc1', trustScore: 87 }
      ],
      biases: ['Viés acadêmico', 'Complexidade excessiva']
    },
    {
      type: 'conservadora',
      content: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
      sources: [
        { title: 'Conservative Think Tank', url: 'https://conservative.org/article1', trustScore: 70 },
        { title: 'Traditional Media', url: 'https://traditional.com/article2', trustScore: 75 }
      ],
      biases: ['Viés ideológico conservador', 'Resistência à mudança', 'Seletividade de dados']
    },
    {
      type: 'progressista',
      content: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
      sources: [
        { title: 'Progressive Think Tank', url: 'https://progressive.org/article1', trustScore: 72 },
        { title: 'Social Movement Report', url: 'https://movement.org/report1', trustScore: 68 },
        { title: 'Activist Publication', url: 'https://activist.com/article1', trustScore: 65 }
      ],
      biases: ['Viés ideológico progressista', 'Foco em mudança social', 'Seletividade de perspectivas']
    }
  ]

  const metrics = [
    { value: 'trustScore', label: 'Confiabilidade das Fontes', icon: '🔒' },
    { value: 'biasCount', label: 'Equilíbrio (menos vieses)', icon: '⚖️' },
    { value: 'sourceCount', label: 'Quantidade de Fontes', icon: '📚' },
    { value: 'complexity', label: 'Complexidade da Análise', icon: '🧠' }
  ]

  return (
    <>
      <SEO
        title="Teste Radar Chart | PluralView"
        description="Demonstração do gráfico radar de comparação de perspectivas"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              📊 Radar Chart - PluralView
            </h1>
            <p className="text-gray-300">
              Visualização interativa de comparação de perspectivas
            </p>
          </div>

          {/* Metric Selector */}
          <div className="mb-8 bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <label className="block text-sm font-medium mb-3">
              Selecione a métrica para visualizar:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetric(m.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    metric === m.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-sm font-semibold">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 mb-8">
            <PerspectiveRadarChart
              perspectives={examplePerspectives}
              metric={metric}
            />
          </div>

          {/* Insights */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4">💡 Insights</h2>
            <div className="space-y-3 text-sm text-gray-300">
              {metric === 'trustScore' && (
                <>
                  <p>
                    ✅ As perspectivas <strong>Acadêmica</strong> e <strong>Técnica</strong> apresentam
                    as fontes mais confiáveis (média 90+/100).
                  </p>
                  <p>
                    ⚠️ A perspectiva <strong>Popular</strong> tem fontes com menor confiabilidade
                    (média 57/100), devido ao uso de redes sociais.
                  </p>
                </>
              )}
              {metric === 'biasCount' && (
                <>
                  <p>
                    ✅ A perspectiva <strong>Técnica</strong> apresenta menos vieses detectados,
                    mantendo maior objetividade.
                  </p>
                  <p>
                    ⚠️ As perspectivas <strong>Conservadora</strong> e <strong>Progressista</strong> têm
                    mais vieses ideológicos identificados.
                  </p>
                </>
              )}
              {metric === 'sourceCount' && (
                <>
                  <p>
                    ✅ A perspectiva <strong>Acadêmica</strong> utiliza o maior número de fontes (4),
                    proporcionando visão mais abrangente.
                  </p>
                  <p>
                    ⚠️ A perspectiva <strong>Popular</strong> tem apenas 2 fontes, limitando a
                    diversidade de informações.
                  </p>
                </>
              )}
              {metric === 'complexity' && (
                <>
                  <p>
                    ✅ As perspectivas <strong>Acadêmica</strong> e <strong>Institucional</strong> apresentam
                    análises mais detalhadas e complexas.
                  </p>
                  <p>
                    ⚠️ A perspectiva <strong>Popular</strong> é mais simples e direta, ideal para
                    compreensão rápida.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Usage Example */}
          <div className="mt-8 bg-blue-500/20 border border-blue-500 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2">📖 Como usar no seu código</h3>
            <pre className="bg-black/30 p-4 rounded-lg overflow-x-auto text-xs text-gray-300">
{`import PerspectiveRadarChart from '../components/PerspectiveRadarChart'

// No seu componente:
<PerspectiveRadarChart
  perspectives={result.perspectives}
  metric="trustScore"
/>

// Métricas disponíveis:
// - trustScore: Confiabilidade das fontes
// - biasCount: Equilíbrio (menos vieses)
// - sourceCount: Quantidade de fontes
// - complexity: Complexidade da análise`}
            </pre>
          </div>
        </div>
      </div>
    </>
  )
}
