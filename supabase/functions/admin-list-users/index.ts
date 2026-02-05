import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get current user
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminCheck } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role to access auth.users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get all profiles with admin-only fields
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select(`
        id, first_name, last_name, nickname, gender, phone_number, phone_verified,
        avatar_url, verification_status, id_verified, id_document_url,
        partner_name, partner_photo_url, partner_gender, is_couple,
        private_address, private_city, private_postal_code,
        age, allergens, dislikes, languages, role, visibility_mode,
        karma, successful_pickups, no_shows, vacation_mode, notification_radius,
        latitude, longitude, iban, display_real_name, is_disabled,
        created_at, updated_at
      `)
      .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    // Fetch emails from auth.users using service role
    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers()
    if (authUsersError) throw authUsersError

    // Create a map of user_id -> email
    const emailMap = new Map<string, string>()
    authUsers.users.forEach(authUser => {
      emailMap.set(authUser.id, authUser.email || '')
    })

    // Merge profiles with emails
    const usersWithEmail = profiles?.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || '-'
    })) || []

    // Also fetch block stats
    const { data: blockStats } = await adminClient
      .from('blocked_users')
      .select('blocker_id, blocked_id')

    // Calculate block counts per user
    const blocksMade = new Map<string, number>()
    const blocksReceived = new Map<string, number>()
    
    blockStats?.forEach(block => {
      blocksMade.set(block.blocker_id, (blocksMade.get(block.blocker_id) || 0) + 1)
      blocksReceived.set(block.blocked_id, (blocksReceived.get(block.blocked_id) || 0) + 1)
    })

    // Add block stats to users
    const usersWithStats = usersWithEmail.map(user => ({
      ...user,
      blocks_made_count: blocksMade.get(user.id) || 0,
      blocks_received_count: blocksReceived.get(user.id) || 0,
      needs_review: (blocksReceived.get(user.id) || 0) >= 3
    }))

    return new Response(
      JSON.stringify({ users: usersWithStats }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-list-users:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
