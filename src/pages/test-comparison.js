import { useState } from 'react'

export default function TestComparison() {
  const [topic, setTopic] = useState('')
  const [perspective, setPerspective] = useState('tecnica')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleTest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-claude-vs-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, perspectiveType: perspective })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao testar')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const parseContent = (content) => {
    if (!content) return { analysis: '', biases: [] }

    if (content.includes('[VIESES]')) {
      const parts = content.split('[VIESES]')
      const analysis = parts[0].replace('[ANÁLISE]', '').trim()
      const biasesText = parts[1].trim()
      const biases = biasesText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())

      return { analysis, biases }
    }

    return { analysis: content, biases: [] }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-2">🥊 GPT vs Claude</h1>
        <p className="text-gray-400 mb-8">Teste de comparação lado a lado</p>

        {/* Form */}
        <form onSubmit={handleTest} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tema para analisar:</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Inteligência Artificial na educação"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Perspectiva:</label>
            <select
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
            >
              <option value="tecnica">Técnica</option>
              <option value="popular">Popular</option>
              <option value="academica">Acadêmica</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Testando...' : '🚀 Testar Ambos'}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8 text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Mais Rápido</div>
                <div className="text-2xl font-bold text-blue-400">{result.comparison.fasterModel}</div>
                <div className="text-xs text-gray-500">{result.comparison.timeDiff}ms de diferença</div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Mais Barato</div>
                <div className="text-2xl font-bold text-green-400">{result.comparison.cheaperModel}</div>
                <div className="text-xs text-gray-500">${result.comparison.costDiff.toFixed(4)} de diferença</div>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Tempo Total</div>
                <div className="text-2xl font-bold text-purple-400">{result.totalTime}ms</div>
                <div className="text-xs text-gray-500">Execução paralela</div>
              </div>
            </div>

            {/* Side by Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GPT Result */}
              <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-blue-500/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-400">🤖 GPT-3.5-turbo</h3>
                  {result.results.gpt.error && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">ERROR</span>
                  )}
                </div>

                {result.results.gpt.error ? (
                  <div className="text-red-300">{result.results.gpt.error}</div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Tempo</div>
                        <div className="font-bold">{result.results.gpt.time}ms</div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Tokens</div>
                        <div className="font-bold">{result.results.gpt.tokens.total}</div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Custo</div>
                        <div className="font-bold">${result.results.gpt.cost.toFixed(4)}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Análise:</h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {parseContent(result.results.gpt.content).analysis}
                      </p>
                    </div>

                    {/* Biases */}
                    {parseContent(result.results.gpt.content).biases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Vieses Detectados:</h4>
                        <ul className="space-y-1 text-xs text-yellow-200/90">
                          {parseContent(result.results.gpt.content).biases.map((bias, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-400">•</span>
                              <span>{bias}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Claude Result */}
              <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-purple-500/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-purple-400">🧠 Claude Sonnet 4</h3>
                  {result.results.claude.error && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">ERROR</span>
                  )}
                </div>

                {result.results.claude.error ? (
                  <div className="text-red-300">{result.results.claude.error}</div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Tempo</div>
                        <div className="font-bold">{result.results.claude.time}ms</div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Tokens</div>
                        <div className="font-bold">{result.results.claude.tokens.total}</div>
                      </div>
                      <div className="bg-gray-900/50 p-2 rounded">
                        <div className="text-gray-500">Custo</div>
                        <div className="font-bold">${result.results.claude.cost.toFixed(4)}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Análise:</h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {parseContent(result.results.claude.content).analysis}
                      </p>
                    </div>

                    {/* Biases */}
                    {parseContent(result.results.claude.content).biases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Vieses Detectados:</h4>
                        <ul className="space-y-1 text-xs text-yellow-200/90">
                          {parseContent(result.results.claude.content).biases.map((bias, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-400">•</span>
                              <span>{bias}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
