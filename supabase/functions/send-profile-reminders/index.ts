import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncompleteProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  private_address: string | null;
  languages: string[] | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Use service role to access all data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find users with incomplete profiles
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all profiles with incomplete critical fields
    const { data: incompleteProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, avatar_url, phone_number, private_address, languages')
      .or('avatar_url.is.null,phone_number.is.null,private_address.is.null');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!incompleteProfiles || incompleteProfiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No incomplete profiles found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email addresses from auth.users
    const userIds = incompleteProfiles.map(p => p.id);
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    // Create a map of user IDs to emails
    const emailMap = new Map(authData.users.map(u => [u.id, u.email]));

    // Get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('profile_reminders')
      .select('user_id, reminder_count, last_sent_at')
      .in('user_id', userIds);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    const reminderMap = new Map(existingReminders?.map(r => [r.user_id, r]) || []);

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of incompleteProfiles) {
      const email = emailMap.get(profile.id);
      if (!email) continue;

      const existingReminder = reminderMap.get(profile.id);
      
      // Skip if already sent 3 reminders
      if (existingReminder && existingReminder.reminder_count >= 3) {
        continue;
      }

      // Skip if last reminder was less than 7 days ago
      if (existingReminder) {
        const lastSent = new Date(existingReminder.last_sent_at);
        if (lastSent > sevenDaysAgo) {
          continue;
        }
      }

      // Determine which fields are missing
      const missingFields: string[] = [];
      if (!profile.avatar_url) missingFields.push('Profilfoto');
      if (!profile.phone_number) missingFields.push('Telefonnummer');
      if (!profile.private_address) missingFields.push('Adresse');

      const missingFieldsList = missingFields.join(', ');
      const reminderNumber = (existingReminder?.reminder_count || 0) + 1;

      // Determine language (default German)
      const userLanguage = profile.languages?.[0] || 'de';
      const isEnglish = userLanguage === 'en';

      const subject = isEnglish
        ? `🏡 Complete your Neighbors Kitchen profile`
        : `🏡 Vervollständige dein Neighbors Kitchen Profil`;

      const htmlContent = isEnglish
        ? `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #F77B1C; margin-bottom: 10px;">Hi ${profile.first_name || 'there'}! 👋</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">
              We noticed your profile is missing some important details. A complete profile helps build trust in our community and makes it easier to share meals with your neighbors!
            </p>

            <div style="background: #FFF5EB; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #F77B1C;">
              <p style="margin: 0; font-weight: 600;">Missing information:</p>
              <p style="margin: 10px 0 0 0; color: #666;">${missingFieldsList}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://share-kitchen-basel.lovable.app/profile" 
                 style="background: #F77B1C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600;">
                Complete my profile →
              </a>
            </div>

            <p style="color: #888; font-size: 14px; text-align: center;">
              This is reminder ${reminderNumber} of 3. We won't send more after that.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="color: #888; font-size: 12px; text-align: center;">
              Neighbors Kitchen Basel - Building community through shared meals 🍽️
            </p>
          </div>
        `
        : `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #F77B1C; margin-bottom: 10px;">Hallo ${profile.first_name || 'du'}! 👋</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Uns ist aufgefallen, dass in deinem Profil noch einige wichtige Angaben fehlen. Ein vollständiges Profil schafft Vertrauen in unserer Community und macht es einfacher, Mahlzeiten mit deinen Nachbarn zu teilen!
            </p>

            <div style="background: #FFF5EB; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #F77B1C;">
              <p style="margin: 0; font-weight: 600;">Fehlende Angaben:</p>
              <p style="margin: 10px 0 0 0; color: #666;">${missingFieldsList}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://share-kitchen-basel.lovable.app/profile" 
                 style="background: #F77B1C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600;">
                Mein Profil vervollständigen →
              </a>
            </div>

            <p style="color: #888; font-size: 14px; text-align: center;">
              Dies ist Erinnerung ${reminderNumber} von 3. Danach erhältst du keine weiteren.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="color: #888; font-size: 12px; text-align: center;">
              Neighbors Kitchen Basel - Gemeinschaft durch geteilte Mahlzeiten 🍽️
            </p>
          </div>
        `;

      try {
        // Send email via Resend API
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Neighbors Kitchen <noreply@send.neighbors-kitchen.ch>",
            to: [email],
            subject: subject,
            html: htmlContent,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error(`Failed to send to ${email}:`, emailData);
          errors.push(`${email}: ${emailData.message || 'Unknown error'}`);
          continue;
        }

        // Update or insert reminder record
        if (existingReminder) {
          await supabase
            .from('profile_reminders')
            .update({
              reminder_count: reminderNumber,
              last_sent_at: new Date().toISOString()
            })
            .eq('user_id', profile.id);
        } else {
          await supabase
            .from('profile_reminders')
            .insert({
              user_id: profile.id,
              reminder_count: 1,
              last_sent_at: new Date().toISOString()
            });
        }

        sentCount++;
        console.log(`Reminder ${reminderNumber} sent to ${email}`);
      } catch (emailError: any) {
        console.error(`Failed to send to ${email}:`, emailError);
        errors.push(`${email}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-profile-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
