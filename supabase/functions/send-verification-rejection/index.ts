import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RejectionRequest {
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
  details?: string;
}

const REASON_LABELS: Record<string, { de: string; en: string }> = {
  blurred_photo: { de: 'Unscharfes oder unlesbares Foto', en: 'Blurred or unreadable photo' },
  missing_document: { de: 'Fehlendes Ausweisdokument', en: 'Missing ID document' },
  incomplete_profile: { de: 'Unvollständiges Profil', en: 'Incomplete profile' },
  duplicate_account: { de: 'Duplikat-Konto erkannt', en: 'Duplicate account detected' },
  document_mismatch: { de: 'Daten stimmen nicht mit Dokument überein', en: 'Data does not match document' },
  other: { de: 'Anderer Grund', en: 'Other reason' },
};

serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Verification rejection function called`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log(`[${requestId}] No authorization header`);
      return new Response(
        JSON.stringify({ error: "Unauthorized - no token provided", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify the user's token with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      console.log(`[${requestId}] Invalid token:`, userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Check if user is admin
    const { data: adminRole, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      console.log(`[${requestId}] User ${user.id} is not an admin`);
      return new Response(
        JSON.stringify({ error: "Forbidden - admin access required", requestId }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${requestId}] Admin ${user.id} authorized`);

    // Parse request body
    const body: RejectionRequest = await req.json();
    const { userId, userEmail, userName, reason, details } = body;

    if (!userId || !userEmail || !userName || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, userEmail, userName, reason", requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${requestId}] Processing rejection for user ${userId} (${userEmail})`);

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error(`[${requestId}] RESEND_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: "Email service not configured", requestId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const reasonLabel = REASON_LABELS[reason]?.de || reason;
    const resubmitUrl = "https://share-kitchen-basel.lovable.app/profile";

    // Send rejection email
    const emailResult = await resend.emails.send({
      from: "Neighbors Kitchen <noreply@neighbors-kitchen.ch>",
      to: [userEmail],
      subject: "Deine Verifizierung bei Neighbors Kitchen",
      html: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifizierung abgelehnt</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color: #dc2626; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">❌ Verifizierung nicht bestanden</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
        Hallo ${userName},
      </p>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
        leider konnten wir deine Verifizierungsanfrage nicht genehmigen.
      </p>
      
      <!-- Reason Box -->
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-weight: 600; color: #dc2626; margin: 0 0 8px 0;">Grund:</p>
        <p style="color: #7f1d1d; margin: 0; font-size: 15px;">${reasonLabel}</p>
        ${details ? `<p style="color: #7f1d1d; margin: 12px 0 0 0; font-size: 14px; font-style: italic;">"${details}"</p>` : ''}
      </div>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
        Keine Sorge – du kannst dich jederzeit erneut verifizieren lassen! Bitte überprüfe die oben genannten Punkte und reiche dann neue Unterlagen ein.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resubmitUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          🔄 Erneut verifizieren
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 32px;">
        Bei Fragen kannst du uns jederzeit unter <a href="mailto:hello@neighbors-kitchen.ch" style="color: #16a34a;">hello@neighbors-kitchen.ch</a> kontaktieren.
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Herzliche Grüsse,<br>
        Dein Neighbors Kitchen Team
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} Neighbors Kitchen – Gemeinsam kochen, gemeinsam geniessen
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log(`[${requestId}] Email sent to ${userEmail}:`, emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId,
        emailId: emailResult.data?.id,
        message: `Rejection email sent to ${userEmail}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error", requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
