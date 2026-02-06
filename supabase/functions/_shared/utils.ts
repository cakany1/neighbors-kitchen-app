/**
 * Shared utilities for Edge Functions
 * Version: 2.0.0
 * 
 * USAGE:
 * import { 
 *   getAdminClient, getAnonClient, getCorsHeaders, jsonError, jsonSuccess, 
 *   generateRequestId, handleCors, validateOrigin, verifyAuth, isAdmin,
 *   safeLog, checkRateLimit 
 * } from '../_shared/utils.ts'
 * 
 * PRODUCTION SECURITY:
 * - Set ALLOWED_ORIGINS in Supabase secrets (comma-separated)
 * - Example: https://neighbors-kitchen.ch,https://share-kitchen-basel.lovable.app
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

// ============= CORS Configuration =============

/**
 * Get allowed origins from environment
 * Returns array of allowed origins or null if not configured (dev mode)
 */
function getAllowedOrigins(): string[] | null {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')
  if (!allowedOrigins) return null
  return allowedOrigins.split(',').map(o => o.trim()).filter(Boolean)
}

/**
 * Validate if a request origin is allowed
 * Returns { valid: boolean, origin: string | null }
 */
export function validateOrigin(requestOrigin: string | null): { valid: boolean; origin: string | null } {
  const allowedOrigins = getAllowedOrigins()
  
  // If ALLOWED_ORIGINS not set, allow all (development mode)
  if (!allowedOrigins) {
    return { valid: true, origin: requestOrigin }
  }
  
  // If no origin header, reject in production
  if (!requestOrigin) {
    return { valid: false, origin: null }
  }
  
  // Check if origin is in allowed list
  const isAllowed = allowedOrigins.includes(requestOrigin)
  return { valid: isAllowed, origin: isAllowed ? requestOrigin : null }
}

/**
 * Get CORS headers based on environment
 * In production, use ALLOWED_ORIGINS env var; in dev, allow all
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  
  // Default allowed headers (comprehensive list)
  const allowedHeaders = [
    'authorization',
    'x-client-info', 
    'apikey',
    'content-type',
    'x-supabase-client-platform',
    'x-supabase-client-platform-version',
    'x-supabase-client-runtime',
    'x-supabase-client-runtime-version',
    'stripe-signature'
  ].join(', ')

  // If ALLOWED_ORIGINS is set, validate the request origin
  if (allowedOrigins && allowedOrigins.length > 0) {
    // Check if request origin is in the allowed list
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return {
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Headers': allowedHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      }
    }
    
    // Origin not in allowed list - return restrictive headers
    return {
      'Access-Control-Allow-Origin': allowedOrigins[0],
      'Access-Control-Allow-Headers': allowedHeaders,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }
  }
  
  // Development mode: allow all origins
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

// Legacy alias for backwards compatibility
export const corsHeaders = getCorsHeaders()

// ============= Client Factories =============

/**
 * Get an admin client using SUPABASE_SERVICE_ROLE_KEY
 * Use for admin operations that bypass RLS
 */
export function getAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

/**
 * Get an anon client with user's auth token
 * Use for user-scoped operations that respect RLS
 */
export function getAnonClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } }
  })
}

// ============= Response Helpers =============

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8)
}

/**
 * Return a JSON error response with proper CORS and request tracking
 */
export function jsonError(
  message: string, 
  status: number = 500, 
  requestId?: string,
  details?: Record<string, unknown>,
  origin?: string | null
): Response {
  const cors = getCorsHeaders(origin)
  
  return new Response(
    JSON.stringify({ 
      error: message,
      ...(requestId && { requestId }),
      ...(details && { details })
    }),
    { 
      status, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    }
  )
}

/**
 * Return a JSON success response with proper CORS
 */
export function jsonSuccess(
  data: Record<string, unknown>,
  status: number = 200,
  origin?: string | null
): Response {
  const cors = getCorsHeaders(origin)
  
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    }
  )
}

/**
 * Return a 403 Forbidden response for disallowed origins
 */
export function forbiddenOrigin(requestId: string, origin?: string | null): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Forbidden: Origin not allowed',
      requestId 
    }),
    { 
      status: 403, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || 'null',
      } 
    }
  )
}

/**
 * Handle CORS preflight request
 * Returns Response for OPTIONS, null otherwise
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    return new Response(null, { headers: getCorsHeaders(origin) })
  }
  return null
}

/**
 * Full origin check: validates origin and returns 403 if not allowed
 * Call this AFTER handleCors() for non-OPTIONS requests
 * Returns null if origin is valid, or Response if rejected
 */
export function checkOrigin(req: Request, requestId: string): Response | null {
  const origin = req.headers.get('Origin')
  const allowedOrigins = getAllowedOrigins()
  
  // If ALLOWED_ORIGINS not configured, skip check (dev mode)
  if (!allowedOrigins) {
    return null
  }
  
  // Validate origin
  if (!origin || !allowedOrigins.includes(origin)) {
    safeLog(requestId, 'warn', 'Rejected request from disallowed origin', { origin })
    return forbiddenOrigin(requestId, origin)
  }
  
  return null
}

// ============= Auth Helpers =============

interface AuthResult {
  success: boolean
  user?: { id: string; email?: string }
  client?: SupabaseClient
  response?: Response
}

/**
 * Verify user authentication and return user object
 * Returns structured result with user/client on success, response on failure
 */
export async function verifyAuth(req: Request, requestId: string): Promise<AuthResult> {
  const origin = req.headers.get('Origin')
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { 
      success: false, 
      response: jsonError('Missing authorization', 401, requestId, undefined, origin)
    }
  }
  
  try {
    const client = getAnonClient(authHeader)
    
    // Use getUser for reliable token validation
    const { data: userData, error: userError } = await client.auth.getUser()
    
    if (userError || !userData?.user) {
      return { 
        success: false, 
        response: jsonError('Unauthorized', 401, requestId, undefined, origin)
      }
    }
    
    const user = {
      id: userData.user.id,
      email: userData.user.email
    }
    
    return { success: true, user, client }
  } catch (err) {
    return { 
      success: false, 
      response: jsonError('Authentication failed', 401, requestId, undefined, origin)
    }
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()
  
  return !!data
}

/**
 * Verify admin authorization (combines auth + role check)
 * Returns structured result with user/client on success, response on failure
 */
export async function verifyAdmin(req: Request, requestId: string): Promise<AuthResult> {
  const origin = req.headers.get('Origin')
  
  const auth = await verifyAuth(req, requestId)
  
  if (!auth.success || !auth.user || !auth.client) {
    return auth
  }
  
  const hasAdminRole = await isAdmin(auth.client, auth.user.id)
  
  if (!hasAdminRole) {
    return { 
      success: false, 
      response: jsonError('Forbidden: Admin access required', 403, requestId, undefined, origin)
    }
  }
  
  return { success: true, user: auth.user, client: auth.client }
}

// ============= Logging Helpers =============

/**
 * Safe logger that masks sensitive data
 */
export function safeLog(
  requestId: string, 
  level: 'info' | 'warn' | 'error', 
  message: string, 
  data?: Record<string, unknown>
): void {
  const maskedData = data ? maskSensitiveData(data) : undefined
  const logMessage = `[${requestId}] ${message}`
  
  switch (level) {
    case 'info':
      console.log(logMessage, maskedData || '')
      break
    case 'warn':
      console.warn(logMessage, maskedData || '')
      break
    case 'error':
      console.error(logMessage, maskedData || '')
      break
  }
}

/**
 * Mask sensitive fields in data objects
 */
function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'iban', 'email', 'phone', 'authorization']
  const masked: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk))
    
    if (isSensitive && typeof value === 'string') {
      masked[key] = value.length > 6 ? value.slice(0, 3) + '***' + value.slice(-3) : '***'
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>)
    } else {
      masked[key] = value
    }
  }
  
  return masked
}

// ============= Rate Limiting (DB-based) =============

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Check rate limit using database table
 * Requires api_rate_limits table to exist
 */
export async function checkRateLimit(
  identifier: string, // IP or user ID
  endpoint: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): Promise<RateLimitResult> {
  const adminClient = getAdminClient()
  const windowStart = new Date(Date.now() - windowMs)
  
  try {
    // Count requests in current window
    const { count, error: countError } = await adminClient
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart.toISOString())
    
    if (countError) {
      console.error('Rate limit check error:', countError)
      // Fail open - allow request if rate limit check fails
      return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + windowMs) }
    }
    
    const currentCount = count || 0
    const allowed = currentCount < limit
    
    if (allowed) {
      // Log this request
      await adminClient
        .from('api_rate_limits')
        .insert({ 
          identifier, 
          endpoint,
          created_at: new Date().toISOString()
        })
    }
    
    return {
      allowed,
      remaining: Math.max(0, limit - currentCount - 1),
      resetAt: new Date(Date.now() + windowMs)
    }
  } catch (err) {
    console.error('Rate limit error:', err)
    // Fail open
    return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + windowMs) }
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export async function cleanupRateLimits(maxAgeMs: number = 3600000): Promise<void> {
  const adminClient = getAdminClient()
  const cutoff = new Date(Date.now() - maxAgeMs)
  
  await adminClient
    .from('api_rate_limits')
    .delete()
    .lt('created_at', cutoff.toISOString())
}
