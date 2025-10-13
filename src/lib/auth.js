import { createClient } from '@supabase/supabase-js'

/**
 * Utilitários de autenticação para APIs
 */

/**
 * Verifica se o usuário está autenticado
 * @param {Object} req - Request object
 * @returns {Promise<Object>} { authenticated: boolean, user?: Object, error?: string }
 */
export async function verifyAuth(req) {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'No authorization token provided'
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // Criar cliente Supabase com o token do usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Verificar token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        authenticated: false,
        error: 'Invalid or expired token'
      }
    }

    return {
      authenticated: true,
      user: user
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Middleware de autenticação para Next.js API Routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object|null>} User object se autenticado, null se não
 */
export async function requireAuth(req, res) {
  const authResult = await verifyAuth(req)

  if (!authResult.authenticated) {
    res.status(401).json({
      error: 'Unauthorized',
      message: authResult.error || 'Authentication required'
    })
    return null
  }

  // Adicionar user ao request para uso posterior
  req.user = authResult.user
  return authResult.user
}

/**
 * Verifica autenticação opcional (não bloqueia se não autenticado)
 * @param {Object} req - Request object
 * @returns {Promise<Object|null>} User object se autenticado, null se não
 */
export async function optionalAuth(req) {
  const authResult = await verifyAuth(req)

  if (authResult.authenticated) {
    req.user = authResult.user
    return authResult.user
  }

  return null
}
