import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { analysisId, perspectiveType, sourceUrl, feedback } = req.body

    if (!analysisId || !perspectiveType || !sourceUrl || !feedback) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validar feedback (relevant ou not_relevant)
    if (!['relevant', 'not_relevant'].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' })
    }

    // Salvar feedback no banco
    const { data, error } = await supabase
      .from('source_feedback')
      .insert({
        analysis_id: analysisId,
        perspective_type: perspectiveType,
        source_url: sourceUrl,
        feedback: feedback,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving feedback:', error)
      throw error
    }

    console.log(`[Feedback] ${feedback} - ${sourceUrl} (${perspectiveType})`)

    res.status(200).json({
      success: true,
      message: 'Feedback recebido com sucesso',
      data
    })

  } catch (error) {
    console.error('Error in feedback-source API:', error)
    res.status(500).json({
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
