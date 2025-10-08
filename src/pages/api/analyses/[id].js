import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Buscar análise
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError) throw analysisError
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' })
    }

    // Buscar perspectivas
    const { data: perspectives, error: perspectivesError } = await supabase
      .from('perspectives')
      .select('*')
      .eq('analysis_id', id)
      .order('type')

    if (perspectivesError) throw perspectivesError

    // Buscar perguntas reflexivas
    const { data: questions, error: questionsError } = await supabase
      .from('reflective_questions')
      .select('*')
      .eq('analysis_id', id)

    if (questionsError) throw questionsError

    res.status(200).json({
      analysis,
      perspectives,
      questions
    })

  } catch (error) {
    console.error('Error fetching analysis:', error)
    res.status(500).json({ error: error.message })
  }
}
