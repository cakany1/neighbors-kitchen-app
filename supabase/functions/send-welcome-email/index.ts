/**
 * Send Welcome Email Edge Function (Combined Welcome + Verification)
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Bilingual email support (DE/EN)
 * - INCLUDES email verification link in the same email
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  checkOrigin,
  jsonError
} from '../_shared/utils.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  language?: string;
  verificationToken?: string;
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, language = 'de' }: WelcomeEmailRequest = await req.json();

    if (!email || !firstName) {
      return jsonError('Missing required fields: email and firstName', 400, requestId, undefined, origin);
    }

    safeLog(requestId, 'info', 'Sending combined welcome + verification email', { email });

    // Generate verification link using Supabase magic link
    let verificationUrl = 'https://www.neighbors-kitchen.ch/login';
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // Generate magic link for email verification
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: 'https://www.neighbors-kitchen.ch/feed',
          }
        });
        
        if (!linkError && linkData?.properties?.action_link) {
          verificationUrl = linkData.properties.action_link;
          safeLog(requestId, 'info', 'Verification link generated successfully');
        } else {
          safeLog(requestId, 'warn', 'Failed to generate verification link', { error: linkError });
        }
      } catch (linkErr) {
        safeLog(requestId, 'warn', 'Error generating verification link', { error: String(linkErr) });
      }
    }

    // German and English versions
    const isGerman = language === 'de';
    
    const subject = isGerman 
      ? `Willkommen bei Neighbors Kitchen, ${firstName}! Bitte bestätige deine E-Mail 📧`
      : `Welcome to Neighbors Kitchen, ${firstName}! Please verify your email 📧`;

    const htmlContent = isGerman 
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🍳 Neighbors Kitchen Basel</h1>
            <p style="color: #666; font-size: 14px;">Teile Essen, baue Vertrauen</p>
          </div>
          
          <h2 style="color: #333;">Hallo ${firstName}! 👋</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Herzlich willkommen in unserer Community! Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
          </p>
          
          <div style="background: #FFF5EB; border-left: 4px solid #F77B1C; padding: 20px; margin: 25px 0; border-radius: 4px; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #333; font-weight: bold;">📧 Bitte bestätige deine E-Mail-Adresse:</p>
            <a href="${verificationUrl}" 
               style="background: #F77B1C; color: white; padding: 14px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
              E-Mail bestätigen →
            </a>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>🎉 Du erhältst 100 Karma-Punkte als Willkommensbonus!</strong></p>
          </div>
          
          <h3 style="color: #333; margin-top: 25px;">So funktioniert's:</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>📧 <strong>Bestätige deine E-Mail</strong> – klicke auf den Button oben</li>
            <li>🍲 <strong>Stöbere los</strong> – entdecke Gerichte im Feed</li>
            <li>👨‍🍳 <strong>Teile deine Kochkünste</strong> und biete überschüssiges Essen an</li>
            <li>⭐ <strong>Sammle Karma</strong> durch Teilen und Zuverlässigkeit</li>
          </ul>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Falls du diesen Account nicht erstellt hast, kannst du diese E-Mail ignorieren.<br><br>
            Neighbors Kitchen Basel – Teile Essen, baue Vertrauen und rette Lebensmittel in deiner Nachbarschaft.
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🍳 Neighbors Kitchen Basel</h1>
            <p style="color: #666; font-size: 14px;">Share food, build trust</p>
          </div>
          
          <h2 style="color: #333;">Hello ${firstName}! 👋</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Welcome to our community! Please verify your email address to activate your account.
          </p>
          
          <div style="background: #FFF5EB; border-left: 4px solid #F77B1C; padding: 20px; margin: 25px 0; border-radius: 4px; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #333; font-weight: bold;">📧 Please verify your email address:</p>
            <a href="${verificationUrl}" 
               style="background: #F77B1C; color: white; padding: 14px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
              Verify Email →
            </a>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>🎉 You'll receive 100 Karma points as a welcome bonus!</strong></p>
          </div>
          
          <h3 style="color: #333; margin-top: 25px;">How it works:</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>📧 <strong>Verify your email</strong> – click the button above</li>
            <li>🍲 <strong>Browse meals</strong> – discover food in the feed</li>
            <li>👨‍🍳 <strong>Share your cooking</strong> and offer excess food</li>
            <li>⭐ <strong>Earn Karma</strong> through sharing and reliability</li>
          </ul>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't create this account, you can safely ignore this email.<br><br>
            Neighbors Kitchen Basel – Share food, build trust and save meals in your neighborhood.
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

    const data = await response.json();

    if (!response.ok) {
      safeLog(requestId, 'error', 'Resend API error', { error: data });
      throw new Error(data.message || "Failed to send email");
    }

    safeLog(requestId, 'info', 'Combined welcome + verification email sent successfully');

    return new Response(JSON.stringify({ ...data, requestId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    safeLog(requestId, 'error', 'Error in send-welcome-email', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});