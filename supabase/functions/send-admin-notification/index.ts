import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'faq' | 'contact';
  content: string;
  senderName?: string;
  senderEmail?: string;
}

// HTML escape function to prevent HTML injection attacks
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

    const { type, content, senderName, senderEmail }: NotificationRequest = await req.json();

    // Admin email - hardcoded for now
    const adminEmail = "cakan.yagiz@gmail.com";

    const isContact = type === 'contact';
    
    // Sanitize all user inputs before using in HTML
    const safeSenderName = escapeHtml(senderName || 'Unbekannt');
    const safeSenderEmail = escapeHtml(senderEmail || 'Keine angegeben');
    const safeContent = escapeHtml(content || '');

    const subject = isContact 
      ? `📩 Neue Kontaktanfrage von ${safeSenderName}`
      : `❓ Neue FAQ-Frage eingereicht`;

    const htmlContent = isContact
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #F77B1C; margin-bottom: 10px;">📩 Neue Kontaktanfrage</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Von:</strong> ${safeSenderName}</p>
            <p style="margin: 0 0 10px 0;"><strong>E-Mail:</strong> ${safeSenderEmail}</p>
            <p style="margin: 0;"><strong>Nachricht:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${safeContent}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://share-kitchen-basel.lovable.app/admin" 
               style="background: #F77B1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; display: inline-block;">
              Zum Admin Dashboard →
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
            <h1 style="color: #F77B1C; margin-bottom: 10px;">❓ Neue FAQ-Frage</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Eingereichte Frage:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 18px;">"${safeContent}"</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://share-kitchen-basel.lovable.app/admin" 
               style="background: #F77B1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; display: inline-block;">
              Im Admin Dashboard beantworten →
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
        from: "Neighbors Kitchen <noreply@send.neighbors-kitchen.ch>",
        to: [adminEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send notification email");
    }

    console.log("Admin notification sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
