export default async function handler(req, res) {
  res.status(200).json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
  })
}
