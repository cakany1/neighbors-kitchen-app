/**
 * Submit Contact Form Edge Function
 * 
 * Features:
 * - Cloudflare Turnstile CAPTCHA verification (server-side)
 * - DB-based rate limiting (persistent across function restarts)
 * - Honeypot spam protection
 * - Input validation and sanitization
 * - Admin notification (non-blocking)
 */

import { 
  getCorsHeaders, 
  getAdminClient, 
  jsonError, 
  jsonSuccess, 
  handleCors,
  generateRequestId,
  checkRateLimit,
  safeLog,
  checkOrigin
} from '../_shared/utils.ts'

// Rate limit configuration (configurable via ENV)
const RATE_LIMIT = parseInt(Deno.env.get('CONTACT_RATE_LIMIT') || '3')
const RATE_WINDOW_MS = parseInt(Deno.env.get('CONTACT_RATE_WINDOW_MS') || '3600000') // 1 hour

// Turnstile verification endpoint
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verify Turnstile CAPTCHA token with Cloudflare
 */
async function verifyTurnstileToken(token: string, ip: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
  
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured')
    return { success: false, error: 'CAPTCHA not configured' }
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    })

    const result = await response.json()
    
    if (result.success) {
      return { success: true }
    } else {
      console.warn('Turnstile verification failed:', result['error-codes'])
      return { 
        success: false, 
        error: result['error-codes']?.join(', ') || 'Verification failed' 
      }
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return { success: false, error: 'Verification request failed' }
  }
}

Deno.serve(async (req) => {
  const requestId = generateRequestId()
  const origin = req.headers.get('Origin')
  
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // PRODUCTION SECURITY: Validate origin
  const originError = checkOrigin(req, requestId)
  if (originError) return originError

  try {
    // Get client IP for rate limiting and CAPTCHA verification
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown'

    safeLog(requestId, 'info', 'Contact form submission', { ip: clientIP })

    // DB-based rate limiting
    const rateLimit = await checkRateLimit(clientIP, 'submit-contact', RATE_LIMIT, RATE_WINDOW_MS)
    
    if (!rateLimit.allowed) {
      safeLog(requestId, 'warn', 'Rate limit exceeded', { ip: clientIP })
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          error_de: 'Zu viele Anfragen. Bitte versuche es später erneut.',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
          requestId
        }),
        { 
          status: 429, 
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          } 
        }
      )
    }

    const { name, email, message, website, captchaToken } = await req.json()

    // Honeypot check - if 'website' field is filled, it's a bot
    if (website && website.trim() !== '') {
      safeLog(requestId, 'info', 'Honeypot triggered - bot detected')
      // Return success to not alert the bot, but don't save
      return jsonSuccess({ success: true, requestId }, 200, origin)
    }

    // CAPTCHA verification - REQUIRED
    if (!captchaToken) {
      safeLog(requestId, 'warn', 'Missing CAPTCHA token')
      return new Response(
        JSON.stringify({
          error: 'Please complete the CAPTCHA verification.',
          error_de: 'Bitte löse die CAPTCHA-Überprüfung.',
          requestId
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify CAPTCHA token with Cloudflare
    const captchaResult = await verifyTurnstileToken(captchaToken, clientIP)
    if (!captchaResult.success) {
      safeLog(requestId, 'warn', 'CAPTCHA verification failed', { error: captchaResult.error })
      return new Response(
        JSON.stringify({
          error: 'CAPTCHA verification failed. Please try again.',
          error_de: 'CAPTCHA-Überprüfung fehlgeschlagen. Bitte erneut versuchen.',
          requestId
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
        }
      )
    }

    safeLog(requestId, 'info', 'CAPTCHA verified successfully')

    // Input validation
    if (!name || !email || !message) {
      return jsonError('All fields are required', 400, requestId, undefined, origin)
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return jsonError('Invalid email address', 400, requestId, undefined, origin)
    }

    // Length limits
    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      return jsonError('Input too long', 400, requestId, undefined, origin)
    }

    // Sanitize inputs (basic HTML escape)
    const sanitize = (str: string) => 
      str.replace(/[<>&"']/g, (c) => 
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c] || c)
      )

    const sanitizedName = sanitize(name.trim())
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedMessage = sanitize(message.trim())

    // Save to database using admin client
    const adminClient = getAdminClient()

    const { error: insertError } = await adminClient
      .from('contact_requests')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        message: sanitizedMessage,
      })

    if (insertError) {
      safeLog(requestId, 'error', 'Database insert error', { error: insertError.message })
      throw new Error('Failed to save contact request')
    }

    safeLog(requestId, 'info', 'Contact request saved successfully')

    // Send admin notification (non-blocking)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      
      await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'contact',
          content: sanitizedMessage,
          senderName: sanitizedName,
          senderEmail: sanitizedEmail,
        }),
      })
    } catch (notifError) {
      safeLog(requestId, 'warn', 'Admin notification failed (non-blocking)')
    }

    return jsonSuccess({ success: true, requestId }, 200, origin)
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    safeLog(requestId, 'error', 'Contact form error', { error: message })
    return jsonError('An error occurred. Please try again.', 500, requestId, undefined, origin)
  }
})
