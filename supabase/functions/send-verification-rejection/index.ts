/**
 * Send Verification Rejection Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Admin-only access
 */

import { Resend } from "npm:resend@2.0.0";
import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAdmin,
  checkOrigin,
  jsonError
} from '../_shared/utils.ts'

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
    // Admin-only access
    const adminAuth = await verifyAdmin(req, requestId);
    if (!adminAuth.success) {
      return adminAuth.response!;
    }

    safeLog(requestId, 'info', 'Admin processing verification rejection', { adminId: adminAuth.user?.id });

    // Parse request body
    const body: RejectionRequest = await req.json();
    const { userId, userEmail, userName, reason, details } = body;

    if (!userId || !userEmail || !userName || !reason) {
      return jsonError("Missing required fields: userId, userEmail, userName, reason", 400, requestId, undefined, origin);
    }

    safeLog(requestId, 'info', 'Processing rejection', { targetUserId: userId });

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      safeLog(requestId, 'error', 'RESEND_API_KEY not configured');
      return jsonError("Email service not configured", 500, requestId, undefined, origin);
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

    safeLog(requestId, 'info', 'Rejection email sent', { emailId: emailResult.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId,
        emailId: emailResult.data?.id,
        message: `Rejection email sent to user`
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    safeLog(requestId, 'error', 'Error in send-verification-rejection', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
