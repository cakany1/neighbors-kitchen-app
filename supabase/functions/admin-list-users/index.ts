/**
 * Admin List Users Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Admin-only access via verifyAdmin
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAdmin,
  checkOrigin,
  jsonError,
  getAdminClient
} from '../_shared/utils.ts'

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

    safeLog(requestId, 'info', 'Admin listing users', { adminId: adminAuth.user?.id });

    // Use admin client for data access
    const adminClient = getAdminClient();

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
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch emails from auth.users using service role
    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;

    // Create a map of user_id -> email
    const emailMap = new Map<string, string>();
    authUsers.users.forEach(authUser => {
      emailMap.set(authUser.id, authUser.email || '');
    });

    // Merge profiles with emails
    const usersWithEmail = profiles?.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || '-'
    })) || [];

    // Also fetch block stats
    const { data: blockStats } = await adminClient
      .from('blocked_users')
      .select('blocker_id, blocked_id');

    // Calculate block counts per user
    const blocksMade = new Map<string, number>();
    const blocksReceived = new Map<string, number>();
    
    blockStats?.forEach(block => {
      blocksMade.set(block.blocker_id, (blocksMade.get(block.blocker_id) || 0) + 1);
      blocksReceived.set(block.blocked_id, (blocksReceived.get(block.blocked_id) || 0) + 1);
    });

    // Add block stats to users
    const usersWithStats = usersWithEmail.map(user => ({
      ...user,
      blocks_made_count: blocksMade.get(user.id) || 0,
      blocks_received_count: blocksReceived.get(user.id) || 0,
      needs_review: (blocksReceived.get(user.id) || 0) >= 3
    }));

    safeLog(requestId, 'info', 'Users listed successfully', { count: usersWithStats.length });

    return new Response(
      JSON.stringify({ users: usersWithStats, requestId }),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    safeLog(requestId, 'error', 'Error in admin-list-users', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
