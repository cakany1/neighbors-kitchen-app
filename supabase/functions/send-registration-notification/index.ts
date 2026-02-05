import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'registration' | 'verification_request';
  userId: string;
  userName: string;
  userEmail?: string;
  isCouple?: boolean;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Use service role to check admin settings (this is server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if notifications are enabled
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'email_notifications')
      .single();

    if (settingsError) {
      console.log('No notification settings found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no_settings' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationSettings = settings.setting_value as {
      new_registration?: boolean;
      new_verification?: boolean;
      recipient?: string;
    };

    const { type, userId, userName, userEmail, isCouple }: NotificationRequest = await req.json();

    // Check if this notification type is enabled
    const isEnabled = type === 'registration' 
      ? notificationSettings.new_registration 
      : notificationSettings.new_verification;

    if (!isEnabled) {
      console.log(`Notification type "${type}" is disabled`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'disabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipient = notificationSettings.recipient || 'hello@neighbors-kitchen.ch';
    const safeName = escapeHtml(userName || 'Unbekannt');
    const safeEmail = escapeHtml(userEmail || 'Keine E-Mail');

    const isRegistration = type === 'registration';
    const coupleLabel = isCouple ? ' (Paar-Account)' : '';
    
    const subject = isRegistration 
      ? `🎉 Neue Registrierung: ${safeName}${coupleLabel}`
      : `🔐 Neue Verifizierungsanfrage: ${safeName}`;

    const htmlContent = isRegistration
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🎉 Neue Registrierung</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${safeName}${coupleLabel}</p>
            <p style="margin: 0 0 10px 0;"><strong>E-Mail:</strong> ${safeEmail}</p>
            <p style="margin: 0;"><strong>User-ID:</strong> ${userId}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://share-kitchen-basel.lovable.app/admin" 
               style="background: #F77B1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; display: inline-block;">
              Im Admin Dashboard ansehen →
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            Neighbors Kitchen Basel - Admin Benachrichtigung
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">🔐 Verifizierungsanfrage</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin: 0;"><strong>User-ID:</strong> ${userId}</p>
            <p style="margin: 10px 0 0 0; color: #666;">Ein Benutzer hat ein ID-Dokument zur Verifizierung hochgeladen.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://share-kitchen-basel.lovable.app/admin" 
               style="background: #F77B1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; display: inline-block;">
              Jetzt prüfen →
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            Neighbors Kitchen Basel - Admin Benachrichtigung
          </p>
        </div>
      `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Neighbors Kitchen <noreply@neighbors-kitchen.ch>",
        to: [recipient],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send notification email");
    }

    console.log("Registration notification sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-registration-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
