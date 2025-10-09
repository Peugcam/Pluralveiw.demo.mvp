import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const textareaRef = useRef(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setCopiedIndex(null)

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

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (topic.trim() && !loading) {
        handleAnalyze(e)
      }
    }
  }

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus()
  }, [])

  return (
    <>
      <Head>
        <title>PluralView MVP - Análise Inteligente de Múltiplas Perspectivas</title>
        <meta name="description" content="Obtenha análises completas e imparciais sobre qualquer tema através de 6 perspectivas diferentes. Use IA para explorar todos os ângulos de um assunto." />
        <meta name="keywords" content="análise de perspectivas, inteligência artificial, múltiplas visões, pensamento crítico, análise imparcial" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PluralView MVP - Análise Inteligente de Múltiplas Perspectivas" />
        <meta property="og:description" content="Obtenha análises completas e imparciais sobre qualquer tema através de 6 perspectivas diferentes." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PluralView MVP - Análise Inteligente de Múltiplas Perspectivas" />
        <meta name="twitter:description" content="Obtenha análises completas e imparciais sobre qualquer tema através de 6 perspectivas diferentes." />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Portuguese" />
        <meta name="author" content="PluralView" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-dark to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-800 bg-dark/80 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text hover:scale-105 transition-transform duration-200 inline-block cursor-default">
              PluralView
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
              Análise inteligente de múltiplas perspectivas
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          {/* Input Form */}
          <div className="bg-gray-800/50 rounded-lg p-4 sm:p-8 border border-gray-700 backdrop-blur-sm hover:border-gray-600 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Qual tema você quer analisar?
            </h2>
            <form onSubmit={handleAnalyze}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: Inteligência Artificial na educação, Energia renovável no Brasil, etc."
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-gray-600 transition-all duration-200"
                  rows={4}
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Dica: Pressione <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">Enter</kbd> para analisar
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="mt-4 w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analisando...
                  </span>
                ) : 'Analisar Perspectivas'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 animate-fadeIn">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-bold">Análise Completa</h3>

              {/* Perspectives */}
              <div className="grid gap-3 sm:gap-4">
                {result.perspectives.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700 backdrop-blur-sm hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 animate-slideUp"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-primary capitalize">
                        📊 Perspectiva {p.type}
                      </h4>
                      <button
                        onClick={() => handleCopy(p.content, idx)}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1 self-start sm:self-auto"
                        title="Copiar perspectiva"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {p.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reflective Questions */}
              {result.questions && result.questions.length > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6 border border-primary/30 hover:border-primary/50 transition-all duration-300 animate-slideUp" style={{ animationDelay: `${result.perspectives.length * 100}ms` }}>
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    💭 Perguntas para Reflexão
                  </h4>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {result.questions.map((q, idx) => (
                      <li key={idx} className="text-sm sm:text-base text-gray-300">
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
        <footer className="border-t border-gray-800 mt-12 sm:mt-20 py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 text-center text-sm sm:text-base text-gray-500">
            <p>PluralView MVP - 2025</p>
          </div>
        </footer>
      </div>
    </>
  )
}
