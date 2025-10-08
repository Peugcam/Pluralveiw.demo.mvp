import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    // Testar inserção simples
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        topic: 'teste',
        status: 'processing'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    res.status(200).json({
      success: true,
      analysisId: data.id,
      message: 'Supabase connection working!'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
