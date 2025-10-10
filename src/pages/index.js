import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [progress, setProgress] = useState(0)
  const textareaRef = useRef(null)
  const [sourceFeedback, setSourceFeedback] = useState({})

  const suggestedTopics = [
    'Inteligência Artificial na educação',
    'Energia renovável no Brasil',
    'Trabalho remoto vs presencial',
    'Redes sociais e saúde mental',
    'Criptomoedas como investimento',
    'Mudanças climáticas'
  ]

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setCopiedIndex(null)
    setProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 800)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })

      const data = await response.json()

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar')
      }

      setResult(data)

      // Salvar no histórico
      saveToHistory({
        topic,
        date: new Date().toISOString(),
        perspectives: data.perspectives,
        questions: data.questions
      })

    } catch (err) {
      setError(err.message)
      setProgress(0)
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 500)
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

  const formatAnalysisText = () => {
    if (!result) return ''

    let text = `ANÁLISE: ${topic}\n`
    text += `${'='.repeat(50)}\n\n`

    result.perspectives.forEach(p => {
      text += `📊 PERSPECTIVA ${p.type.toUpperCase()}\n`
      text += `${'-'.repeat(50)}\n`
      text += `${p.content}\n\n`
    })

    if (result.questions && result.questions.length > 0) {
      text += `💭 PERGUNTAS PARA REFLEXÃO\n`
      text += `${'-'.repeat(50)}\n`
      result.questions.forEach((q, idx) => {
        text += `${idx + 1}. ${q}\n`
      })
    }

    text += `\n${'='.repeat(50)}\n`
    text += `Gerado por PluralView - https://pluralview-mvp.vercel.app/\n`

    return text
  }

  const handleShareWhatsApp = () => {
    const text = `🧠 Análise PluralView: ${topic}\n\nVeja múltiplas perspectivas sobre este tema:\n${window.location.href}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleShareTwitter = () => {
    const text = `🧠 Análise de múltiplas perspectivas sobre: ${topic}`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }

  const handleDownloadText = () => {
    const text = formatAnalysisText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pluralview-${topic.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = async () => {
    const text = formatAnalysisText()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex('all')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const saveToHistory = (analysis) => {
    const existing = JSON.parse(localStorage.getItem('pluralview_history') || '[]')
    const updated = [analysis, ...existing].slice(0, 10) // Manter apenas as 10 últimas
    localStorage.setItem('pluralview_history', JSON.stringify(updated))
    setHistory(updated)
  }

  const loadHistory = () => {
    const stored = JSON.parse(localStorage.getItem('pluralview_history') || '[]')
    setHistory(stored)
  }

  const loadFromHistory = (item) => {
    setTopic(item.topic)
    setResult({
      perspectives: item.perspectives,
      questions: item.questions
    })
    setShowHistory(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearHistory = () => {
    localStorage.removeItem('pluralview_history')
    setHistory([])
    setShowHistory(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('pluralview_theme', newTheme)
    document.documentElement.classList.toggle('light', newTheme === 'light')
  }

  const handleNewAnalysis = () => {
    setTopic('')
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectSuggestedTopic = (suggestedTopic) => {
    setTopic(suggestedTopic)
    textareaRef.current?.focus()
  }

  const handleSourceFeedback = async (perspectiveType, sourceUrl, feedback) => {
    try {
      const feedbackKey = `${perspectiveType}-${sourceUrl}`

      // Atualizar UI imediatamente
      setSourceFeedback(prev => ({
        ...prev,
        [feedbackKey]: feedback
      }))

      // Enviar para API
      await fetch('/api/feedback-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: result.analysisId,
          perspectiveType,
          sourceUrl,
          feedback
        })
      })

      console.log(`Feedback enviado: ${feedback} para ${sourceUrl}`)
    } catch (err) {
      console.error('Erro ao enviar feedback:', err)
    }
  }

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus()

    // Load theme
    const savedTheme = localStorage.getItem('pluralview_theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('light', savedTheme === 'light')

    // Load history
    loadHistory()
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text hover:scale-105 transition-transform duration-200 inline-block cursor-default">
                  PluralView
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
                  Análise inteligente de múltiplas perspectivas
                </p>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-all duration-200"
                  title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                {/* History Button */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-all duration-200"
                  title="Histórico"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-white">
                      {history.length}
                    </span>
                  )}
                </button>

                {/* New Analysis Button */}
                {result && (
                  <button
                    onClick={handleNewAnalysis}
                    className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-200 text-sm font-medium hidden sm:flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Análise
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* History Panel */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-40 animate-fadeIn" onClick={() => setShowHistory(false)}>
            <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-dark border-l border-gray-800 p-6 overflow-y-auto animate-slideIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Histórico</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Nenhuma análise no histórico</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {history.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-primary/50 cursor-pointer transition-all duration-200"
                        onClick={() => loadFromHistory(item)}
                      >
                        <p className="font-medium text-sm mb-1 line-clamp-2">{item.topic}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={clearHistory}
                    className="mt-4 w-full py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    Limpar Histórico
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          {/* Input Form */}
          <div className="bg-gray-800/50 rounded-lg p-4 sm:p-8 border border-gray-700 backdrop-blur-sm hover:border-gray-600 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Qual tema você quer analisar?
            </h2>

            {/* Suggested Topics */}
            {!result && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">💡 Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTopics.map((sugTopic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestedTopic(sugTopic)}
                      className="px-3 py-1.5 text-sm bg-gray-700/50 hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-105"
                    >
                      {sugTopic}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

              {/* Progress Bar */}
              {loading && progress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Gerando perspectivas...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
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
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                      {p.content}
                    </p>

                    {/* Sources */}
                    {p.sources && p.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm font-semibold text-gray-400 mb-3">
                          📚 Fontes e Referências
                          <span className="ml-2 text-xs text-gray-500">(avalie a relevância)</span>
                        </p>
                        <div className="space-y-2">
                          {p.sources.map((source, sIdx) => {
                            const feedbackKey = `${p.type}-${source.url}`
                            const currentFeedback = sourceFeedback[feedbackKey]

                            return (
                            <div
                              key={sIdx}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-700/30 transition-all duration-200 group"
                            >
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 flex-1"
                              >
                              {/* Icon based on type */}
                              <div className="flex-shrink-0 mt-0.5">
                                {source.type === 'institucional' && (
                                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                )}
                                {source.type === 'academico' && (
                                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                )}
                                {source.type === 'video' && (
                                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                )}
                                {source.type === 'midia' && (
                                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                  </svg>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 group-hover:text-primary transition-colors line-clamp-1">
                                  {source.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {new URL(source.url).hostname}
                                </p>
                              </div>

                              <svg className="w-4 h-4 text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              </a>

                              {/* Feedback buttons */}
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={() => handleSourceFeedback(p.type, source.url, 'relevant')}
                                  className={`p-1 rounded transition-all ${
                                    currentFeedback === 'relevant'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-700 text-gray-400 hover:bg-green-700 hover:text-white'
                                  }`}
                                  title="Fonte relevante"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleSourceFeedback(p.type, source.url, 'not_relevant')}
                                  className={`p-1 rounded transition-all ${
                                    currentFeedback === 'not_relevant'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-700 text-gray-400 hover:bg-red-700 hover:text-white'
                                  }`}
                                  title="Fonte não relevante"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    )}
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

              {/* Share Actions */}
              <div className="bg-gray-800/30 rounded-lg p-4 sm:p-6 border border-gray-700 animate-slideUp" style={{ animationDelay: `${(result.perspectives.length + 1) * 100}ms` }}>
                <h4 className="text-base sm:text-lg font-semibold mb-4 text-center">
                  📤 Compartilhar Análise
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex flex-col items-center gap-2 p-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Compartilhar no WhatsApp"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>

                  {/* Twitter */}
                  <button
                    onClick={handleShareTwitter}
                    className="flex flex-col items-center gap-2 p-3 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Compartilhar no Twitter"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-xs font-medium">Twitter</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex flex-col items-center gap-2 p-3 bg-[#0077B5] hover:bg-[#006399] text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Compartilhar no LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-xs font-medium">LinkedIn</span>
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownloadText}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    title="Baixar como texto"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-xs font-medium">Download</span>
                  </button>
                </div>

                {/* Copy All Button */}
                <button
                  onClick={handleCopyAll}
                  className="mt-4 w-full flex items-center justify-center gap-2 p-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  {copiedIndex === 'all' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Copiar Análise Completa</span>
                    </>
                  )}
                </button>
              </div>
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
