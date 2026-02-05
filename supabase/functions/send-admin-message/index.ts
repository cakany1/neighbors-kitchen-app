import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MessageRequest {
  userIds: string[];
  subject: string;
  message: string;
}

// HTML escape function to prevent HTML injection attacks
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with admin access for checking roles
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { userIds, subject, message }: MessageRequest = await req.json();

    if (!userIds?.length || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'userIds, subject, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user emails from auth.users using admin client
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error('Failed to fetch user data');
    }

    // Filter to only requested users and get their emails
    const targetEmails = users.users
      .filter(u => userIds.includes(u.id) && u.email)
      .map(u => u.email!);

    if (targetEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid email addresses found for selected users' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #F77B1C; margin-bottom: 10px;">📬 Nachricht von Neighbors Kitchen</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #333;">${safeSubject}</h2>
          <div style="color: #555; line-height: 1.6;">
            ${safeMessage}
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://share-kitchen-basel.lovable.app" 
             style="background: #F77B1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; display: inline-block;">
            Zur App →
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
          Neighbors Kitchen Basel - Community-Nachricht
        </p>
      </div>
    `;

    // Send emails in batches (Resend supports up to 100 recipients per request)
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetEmails.length; i += batchSize) {
      const batch = targetEmails.slice(i, i + batchSize);
      
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Neighbors Kitchen <noreply@neighbors-kitchen.ch>",
            bcc: batch, // Use BCC to hide other recipients
            subject: `[Neighbors Kitchen] ${subject}`,
            html: htmlContent,
          }),
        });

        const emailData = await response.json();

        if (!response.ok) {
          console.error("Resend API error:", emailData);
          failCount += batch.length;
        } else {
          console.log(`Batch sent successfully: ${batch.length} emails`);
          successCount += batch.length;
        }
      } catch (error) {
        console.error("Error sending batch:", error);
        failCount += batch.length;
      }
    }

    console.log(`Admin message sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        successCount,
        failCount,
        message: `Nachricht an ${successCount} User gesendet` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
