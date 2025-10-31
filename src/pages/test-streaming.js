import { useState } from 'react'
import { useStreamingAnalysis } from '../hooks/useStreamingAnalysis'
import SEO from '../components/SEO'

export default function TestStreaming() {
  const [topic, setTopic] = useState('')
  const {
    analyze,
    reset,
    loading,
    progress,
    perspectives,
    questions,
    error,
    totalPerspectives
  } = useStreamingAnalysis()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (topic.trim()) {
      await analyze(topic)
    }
  }

  const perspectiveLabels = {
    tecnica: 'Técnica',
    popular: 'Popular',
    institucional: 'Institucional',
    academica: 'Acadêmica',
    conservadora: 'Conservadora',
    progressista: 'Progressista'
  }

  const perspectiveColors = {
    tecnica: 'blue',
    popular: 'green',
    institucional: 'purple',
    academica: 'indigo',
    conservadora: 'orange',
    progressista: 'pink'
  }

  const getTrustColor = (score) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    if (score >= 40) return 'orange'
    return 'red'
  }

  return (
    <>
      <SEO
        title="Teste Streaming | PluralView"
        description="Teste da funcionalidade de streaming em tempo real"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              ⚡ Streaming SSE - PluralView
            </h1>
            <p className="text-gray-300">
              Perspectivas aparecem progressivamente à medida que são geradas
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <label className="block text-sm font-medium mb-2">
                Digite um tópico para análise:
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Inteligência Artificial na educação"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20
                           text-white placeholder-gray-400 focus:outline-none focus:ring-2
                           focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600
                           rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Analisando...' : 'Analisar'}
                </button>
                {perspectives.length > 0 && !loading && (
                  <button
                    type="button"
                    onClick={reset}
                    className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Progress Bar */}
          {loading && (
            <div className="mb-6 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {perspectives.length} de {totalPerspectives} perspectivas geradas
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-200">❌ {error}</p>
            </div>
          )}

          {/* Perspectives Grid */}
          {perspectives.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                📊 Perspectivas ({perspectives.length}/{totalPerspectives})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perspectives.map((persp, idx) => persp && (
                  <div
                    key={idx}
                    className={`bg-white/10 backdrop-blur-md rounded-lg p-6 border-2 border-${perspectiveColors[persp.type]}-500/50
                               animate-fadeIn`}
                    style={{
                      animation: `fadeIn 0.5s ease-in-out`
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">
                        {perspectiveLabels[persp.type]}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                      bg-${perspectiveColors[persp.type]}-500/30
                                      text-${perspectiveColors[persp.type]}-200`}>
                        {persp.type}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="text-gray-200 text-sm mb-4 leading-relaxed">
                      {persp.content}
                    </div>

                    {/* Sources */}
                    {persp.sources && persp.sources.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 mb-2">FONTES:</p>
                        <div className="space-y-2">
                          {persp.sources.map((source, sIdx) => (
                            <div key={sIdx} className="text-xs">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {source.title}
                              </a>
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold
                                              bg-${getTrustColor(source.trustScore)}-500/30
                                              text-${getTrustColor(source.trustScore)}-200`}>
                                Trust: {source.trustScore}/100
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Biases */}
                    {persp.biases && persp.biases.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">⚠️ VIESES DETECTADOS:</p>
                        <ul className="space-y-1">
                          {persp.biases.map((bias, bIdx) => (
                            <li key={bIdx} className="text-xs text-gray-300">
                              • {bias}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {/* Placeholder para perspectivas pendentes */}
                {loading && Array.from({ length: totalPerspectives - perspectives.length }).map((_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="bg-white/5 backdrop-blur-md rounded-lg p-6 border-2 border-gray-700/50
                               animate-pulse"
                  >
                    <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {questions.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4">💭 Perguntas para Reflexão</h2>
              <ul className="space-y-3">
                {questions.map((q, idx) => (
                  <li key={idx} className="text-gray-200 flex items-start gap-3">
                    <span className="text-blue-400 font-bold flex-shrink-0">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
