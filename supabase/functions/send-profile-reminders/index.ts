import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface IncompleteProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  private_address: string | null;
  languages: string[] | null;
  vacation_mode: boolean | null;
}

Deno.serve(async (req) => {
  // Generate request ID for debugging
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error(`[${requestId}] Missing or invalid Authorization header`)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Authorization header is missing or invalid',
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the user's token
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      console.error(`[${requestId}] Auth verification failed:`, authError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid or expired authentication token',
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Check if user is admin
    const { data: adminCheck, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) {
      console.error(`[${requestId}] Role check error:`, roleError)
    }

    if (!adminCheck) {
      console.error(`[${requestId}] User ${user.id} is not an admin`)
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          message: 'Admin access required to send reminders',
          requestId 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] Admin ${user.id} authorized, starting reminder process`)

    // 3. Now use service role to access all data
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error(`[${requestId}] RESEND_API_KEY is not configured`)
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Error', 
          message: 'Email service is not configured',
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find users with incomplete profiles
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get all profiles with incomplete critical fields
    // TASK 32: Filter out users in vacation mode in-memory (they don't want notifications)
    const { data: rawProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, avatar_url, phone_number, private_address, languages, vacation_mode')
      .or('avatar_url.is.null,phone_number.is.null,private_address.is.null')

    // Filter out users with vacation_mode enabled
    const incompleteProfiles = rawProfiles?.filter(p => !p.vacation_mode) || []

    if (profilesError) {
      console.error(`[${requestId}] Error fetching profiles:`, profilesError)
      return new Response(
        JSON.stringify({ 
          error: 'Database Error', 
          message: 'Failed to fetch incomplete profiles',
          details: profilesError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!incompleteProfiles || incompleteProfiles.length === 0) {
      console.log(`[${requestId}] No incomplete profiles found`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No incomplete profiles found', 
          sent: 0,
          requestId 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email addresses from auth.users
    const userIds = incompleteProfiles.map(p => p.id)
    const { data: authData, error: authUsersError } = await supabase.auth.admin.listUsers()
    
    if (authUsersError) {
      console.error(`[${requestId}] Error fetching auth users:`, authUsersError)
      return new Response(
        JSON.stringify({ 
          error: 'Database Error', 
          message: 'Failed to fetch user emails',
          details: authUsersError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a map of user IDs to emails
    const emailMap = new Map(authData.users.map(u => [u.id, u.email]))

    // Get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('profile_reminders')
      .select('user_id, reminder_count, last_sent_at')
      .in('user_id', userIds)

    if (remindersError) {
      console.error(`[${requestId}] Error fetching reminders:`, remindersError)
      return new Response(
        JSON.stringify({ 
          error: 'Database Error', 
          message: 'Failed to fetch reminder history',
          details: remindersError.message,
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reminderMap = new Map(existingReminders?.map(r => [r.user_id, r]) || [])

    let sentCount = 0
    const errors: string[] = []
    const sentTo: string[] = []

    for (const profile of incompleteProfiles) {
      const email = emailMap.get(profile.id)
      if (!email) continue

      const existingReminder = reminderMap.get(profile.id)
      
      // Skip if already sent 3 reminders
      if (existingReminder && existingReminder.reminder_count >= 3) {
        continue
      }

      // Skip if last reminder was less than 7 days ago
      if (existingReminder) {
        const lastSent = new Date(existingReminder.last_sent_at)
        if (lastSent > sevenDaysAgo) {
          continue
        }
      }

      // Determine which fields are missing
      const missingFields: string[] = []
      if (!profile.avatar_url) missingFields.push('Profilfoto')
      if (!profile.phone_number) missingFields.push('Telefonnummer')
      if (!profile.private_address) missingFields.push('Adresse')

      const missingFieldsList = missingFields.join(', ')
      const reminderNumber = (existingReminder?.reminder_count || 0) + 1

      // Determine language (default German)
      const userLanguage = profile.languages?.[0] || 'de'
      const isEnglish = userLanguage === 'en'

      const subject = isEnglish
        ? `🏡 Complete your Neighbors Kitchen profile`
        : `🏡 Vervollständige dein Neighbors Kitchen Profil`

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
              <a href="https://neighbors-kitchen.ch/profile" 
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
              <a href="https://neighbors-kitchen.ch/profile" 
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
        `

      try {
        // Send email via Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Neighbors Kitchen <noreply@neighbors-kitchen.ch>',
            to: [email],
            subject: subject,
            html: htmlContent,
          }),
        })

        const emailData = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error(`[${requestId}] Failed to send to ${email}:`, emailData)
          errors.push(`${email}: ${emailData.message || 'Unknown error'}`)
          continue
        }

        // Update or insert reminder record
        if (existingReminder) {
          await supabase
            .from('profile_reminders')
            .update({
              reminder_count: reminderNumber,
              last_sent_at: new Date().toISOString()
            })
            .eq('user_id', profile.id)
        } else {
          await supabase
            .from('profile_reminders')
            .insert({
              user_id: profile.id,
              reminder_count: 1,
              last_sent_at: new Date().toISOString()
            })
        }

        sentCount++
        sentTo.push(email)
        console.log(`[${requestId}] Reminder ${reminderNumber} sent to ${email}`)
      } catch (emailError: any) {
        console.error(`[${requestId}] Failed to send to ${email}:`, emailError)
        errors.push(`${email}: ${emailError.message}`)
      }
    }

    console.log(`[${requestId}] Completed: sent=${sentCount}, errors=${errors.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        sentTo: sentTo,
        errors: errors.length > 0 ? errors : undefined,
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error:`, error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message,
        requestId 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
