/**
 * Send Welcome Email Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Bilingual email support (DE/EN)
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError
} from '../_shared/utils.ts'

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
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
    // Authentication check
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }
    const authenticatedEmail = auth.user?.email;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, language = 'de' }: WelcomeEmailRequest = await req.json();

    // Security: Only allow sending welcome email to the authenticated user's own email
    if (email !== authenticatedEmail) {
      return jsonError('You can only send welcome emails to your own email address', 403, requestId, undefined, origin);
    }

    safeLog(requestId, 'info', 'Sending welcome email', { userId: auth.user?.id });

    // German and English versions
    const isGerman = language === 'de';
    
    const subject = isGerman 
      ? `Willkommen bei Neighbors Kitchen, ${firstName}! 🍳`
      : `Welcome to Neighbors Kitchen, ${firstName}! 🍳`;

    const htmlContent = isGerman 
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🍳 Neighbors Kitchen Basel</h1>
            <p style="color: #666; font-size: 14px;">Teile Essen, baue Vertrauen</p>
          </div>
          
          <h2 style="color: #333;">Hallo ${firstName}! 👋</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Herzlich willkommen in unserer Community! Du kannst jetzt sofort loslegen und Gerichte in deiner Nachbarschaft entdecken.
          </p>
          
          <div style="background: #FFF5EB; border-left: 4px solid #F77B1C; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>🎉 Du hast 100 Karma-Punkte als Willkommensbonus erhalten!</strong></p>
          </div>
          
          <h3 style="color: #333; margin-top: 25px;">So funktioniert's:</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>🍲 <strong>Stöbere sofort los</strong> – entdecke Gerichte im Feed</li>
            <li>📸 <strong>Beim ersten Buchen</strong> wirst du nach Profilfoto, Adresse und Telefon gefragt</li>
            <li>👨‍🍳 <strong>Teile deine Kochkünste</strong> und biete überschüssiges Essen an</li>
            <li>⭐ <strong>Sammle Karma</strong> durch Teilen und Zuverlässigkeit</li>
            <li>🔒 <strong>Optional:</strong> Verifiziere dein Profil für den blauen Haken</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://share-kitchen-basel.lovable.app/feed" 
               style="background: #F77B1C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Jetzt stöbern →
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
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
            Welcome to our community! You can start browsing meals in your neighborhood right away.
          </p>
          
          <div style="background: #FFF5EB; border-left: 4px solid #F77B1C; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333;"><strong>🎉 You've received 100 Karma points as a welcome bonus!</strong></p>
          </div>
          
          <h3 style="color: #333; margin-top: 25px;">How it works:</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>🍲 <strong>Browse right away</strong> – discover meals in the feed</li>
            <li>📸 <strong>When you book</strong>, you'll be asked for your photo, address, and phone</li>
            <li>👨‍🍳 <strong>Share your cooking</strong> and offer excess food</li>
            <li>⭐ <strong>Earn Karma</strong> through sharing and reliability</li>
            <li>🔒 <strong>Optional:</strong> Verify your profile for the blue badge</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://share-kitchen-basel.lovable.app/feed" 
               style="background: #F77B1C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Start Browsing →
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
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

    safeLog(requestId, 'info', 'Welcome email sent successfully');

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
