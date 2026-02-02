import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  language?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - only authenticated users can trigger welcome emails
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user's email from claims
    const authenticatedEmail = claimsData.claims.email;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, language = 'de' }: WelcomeEmailRequest = await req.json();

    // Security: Only allow sending welcome email to the authenticated user's own email
    if (email !== authenticatedEmail) {
      return new Response(
        JSON.stringify({ error: 'You can only send welcome emails to your own email address' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
