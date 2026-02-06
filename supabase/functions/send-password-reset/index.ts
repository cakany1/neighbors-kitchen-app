/**
 * Send Password Reset Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS and logging
 * - Origin validation for production security
 * - No auth required (public endpoint for password reset)
 * - Uses Supabase Admin API for secure reset link generation
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  checkOrigin,
  jsonError,
  getAdminClient
} from '../_shared/utils.ts'

interface PasswordResetRequest {
  email: string;
  language?: string;
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  const origin = req.headers.get('Origin');
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // PRODUCTION SECURITY: Validate origin
  const originError = checkOrigin(req, requestId);
  if (originError) return originError;

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    safeLog(requestId, 'info', 'Starting password reset process');
    
    if (!RESEND_API_KEY) {
      safeLog(requestId, 'error', 'RESEND_API_KEY is not configured');
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, language = 'de' }: PasswordResetRequest = await req.json();

    if (!email || !email.includes('@')) {
      return jsonError('Valid email is required', 400, requestId, undefined, origin);
    }

    // Use admin client for password reset
    const supabaseAdmin = getAdminClient();

    // Generate password reset link using Supabase Admin API
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.neighbors-kitchen.ch/login',
      }
    });

    if (resetError) {
      safeLog(requestId, 'warn', 'Reset link generation error (not revealing to user)');
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: 'If this email exists, a reset link has been sent.', requestId }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      safeLog(requestId, 'warn', 'No reset link generated');
      return new Response(
        JSON.stringify({ success: true, message: 'If this email exists, a reset link has been sent.', requestId }),
        { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Prepare localized email content
    const isGerman = language === 'de';
    
    const subject = isGerman 
      ? 'Passwort zurücksetzen - Neighbors Kitchen'
      : 'Reset Your Password - Neighbors Kitchen';

    const htmlContent = isGerman 
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🍳 Neighbors Kitchen Basel</h1>
          </div>
          
          <h2 style="color: #333;">Passwort zurücksetzen</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu erstellen.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #F77B1C; color: white; padding: 14px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Passwort zurücksetzen →
            </a>
          </div>
          
          <p style="color: #888; font-size: 13px;">
            Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort wird nicht geändert.
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Dieser Link ist 24 Stunden gültig.
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🍳 Neighbors Kitchen Basel</h1>
          </div>
          
          <h2 style="color: #333;">Reset Your Password</h2>
          
          <p style="color: #555; line-height: 1.6;">
            You requested to reset your password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #F77B1C; color: white; padding: 14px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Reset Password →
            </a>
          </div>
          
          <p style="color: #888; font-size: 13px;">
            If you didn't request this, you can safely ignore this email. Your password will not be changed.
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This link is valid for 24 hours.
          </p>
        </div>
      `;

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Neighbors Kitchen <noreply@neighbors-kitchen.ch>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      safeLog(requestId, 'error', 'Resend API error', { error: emailData });
      throw new Error(emailData.message || "Failed to send email");
    }

    safeLog(requestId, 'info', 'Password reset email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent successfully', requestId }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    safeLog(requestId, 'error', 'Error in send-password-reset', { error: message });
    // Always return success to prevent email enumeration attacks
    return new Response(
      JSON.stringify({ success: true, message: 'If this email exists, a reset link has been sent.', requestId }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
