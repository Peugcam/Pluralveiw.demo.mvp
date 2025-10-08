import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-dark/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold gradient-text">
            PluralView
          </h1>
          <p className="text-gray-400 mt-2">
            Análise inteligente de múltiplas perspectivas
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Input Form */}
        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">
            Qual tema você quer analisar?
          </h2>
          <form onSubmit={handleAnalyze}>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Inteligência Artificial na educação, Energia renovável no Brasil, etc."
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={4}
              required
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="mt-4 w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Analisando...' : 'Analisar Perspectivas'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold">Análise Completa</h3>

            {/* Perspectives */}
            <div className="grid gap-4">
              {result.perspectives.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm"
                >
                  <h4 className="text-lg font-semibold text-primary mb-3 capitalize">
                    📊 Perspectiva {p.type}
                  </h4>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {p.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Reflective Questions */}
            {result.questions && result.questions.length > 0 && (
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/30">
                <h4 className="text-lg font-semibold mb-4">
                  💭 Perguntas para Reflexão
                </h4>
                <ul className="space-y-2">
                  {result.questions.map((q, idx) => (
                    <li key={idx} className="text-gray-300">
                      • {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>PluralView MVP - 2025</p>
        </div>
      </footer>
    </div>
  )
}
