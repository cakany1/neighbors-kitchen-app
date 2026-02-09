import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  type: 'new_meal_nearby' | 'booking_update' | 'message' | 'rating' | 'custom';
  user_ids?: string[];           // Specific users to notify
  radius_km?: number;            // For nearby notifications
  center_lat?: number;           // For nearby notifications
  center_lng?: number;           // For nearby notifications
  title: string;
  body: string;
  data?: Record<string, string>; // Custom data for deep linking
  environment?: 'development' | 'staging' | 'production';
}

interface FCMMessage {
  to: string;
  notification: {
    title: string;
    body: string;
    sound?: string;
    badge?: number;
  };
  data?: Record<string, string>;
  priority: 'high' | 'normal';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(JSON.stringify({ error: 'Push notifications not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: PushPayload = await req.json();
    const { type, user_ids, radius_km, center_lat, center_lng, title, body, data, environment = 'production' } = payload;

    console.log('[Push] Sending notification:', { type, userCount: user_ids?.length, environment });

    // Get target tokens based on notification type
    let tokens: { id: string; token: string; user_id: string; platform: string }[] = [];

    if (user_ids && user_ids.length > 0) {
      // Send to specific users
      const { data: tokenData, error } = await supabase
        .from('device_push_tokens')
        .select('id, token, user_id, platform')
        .in('user_id', user_ids)
        .eq('is_active', true)
        .eq('environment', environment);

      if (error) throw error;
      tokens = tokenData || [];
    } else if (radius_km && center_lat && center_lng && type === 'new_meal_nearby') {
      // Find users within radius who have notification preferences set
      // This uses the profiles table with lat/lng
      const { data: nearbyProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, latitude, longitude, notification_radius')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (profileError) throw profileError;

      // Filter by distance (simple Haversine approximation)
      const nearbyUserIds = (nearbyProfiles || [])
        .filter(profile => {
          if (!profile.latitude || !profile.longitude) return false;
          const userRadius = profile.notification_radius || 5; // Default 5km
          const distance = calculateDistance(
            center_lat, center_lng,
            profile.latitude, profile.longitude
          );
          return distance <= Math.min(radius_km, userRadius);
        })
        .map(p => p.id);

      if (nearbyUserIds.length > 0) {
        const { data: tokenData, error } = await supabase
          .from('device_push_tokens')
          .select('id, token, user_id, platform')
          .in('user_id', nearbyUserIds)
          .eq('is_active', true)
          .eq('environment', environment);

        if (error) throw error;
        tokens = tokenData || [];
      }
    }

    if (tokens.length === 0) {
      console.log('[Push] No tokens found for notification');
      return new Response(JSON.stringify({ 
        success: true, 
        sent: 0, 
        message: 'No active tokens found' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Push] Found ${tokens.length} tokens to notify`);

    // Send to FCM
    const results = await Promise.allSettled(
      tokens.map(async (tokenRecord) => {
        const message: FCMMessage = {
          to: tokenRecord.token,
          notification: {
            title,
            body,
            sound: 'default',
          },
          data: {
            ...data,
            type,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          priority: 'high',
        };

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();

        // Log the notification
        await supabase
          .from('push_notification_logs')
          .insert({
            user_id: tokenRecord.user_id,
            token_id: tokenRecord.id,
            notification_type: type,
            title,
            body,
            data: data || {},
            status: response.ok && result.success === 1 ? 'sent' : 'failed',
            error_message: result.results?.[0]?.error || null,
            environment,
            sent_at: new Date().toISOString(),
          });

        // Handle invalid tokens
        if (result.results?.[0]?.error === 'NotRegistered' || 
            result.results?.[0]?.error === 'InvalidRegistration') {
          // Deactivate invalid token
          await supabase
            .from('device_push_tokens')
            .update({ is_active: false })
            .eq('id', tokenRecord.id);
          console.log(`[Push] Deactivated invalid token: ${tokenRecord.id}`);
        }

        return { tokenId: tokenRecord.id, success: response.ok && result.success === 1, result };
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.length - successCount;

    console.log(`[Push] Sent: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
      success: true,
      sent: successCount,
      failed: failCount,
      total: tokens.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Simple Haversine distance calculation (returns km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

serve(handler);
