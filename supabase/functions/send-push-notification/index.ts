import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64url } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  type: 'new_meal_nearby' | 'booking_update' | 'message' | 'rating' | 'custom';
  user_ids?: string[];
  radius_km?: number;
  center_lat?: number;
  center_lng?: number;
  title: string;
  body: string;
  data?: Record<string, string>;
  environment?: 'development' | 'staging' | 'production';
}

interface FCMv1Message {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    android?: {
      priority: 'high' | 'normal';
      notification?: {
        sound: string;
        click_action: string;
      };
    };
    apns?: {
      payload: {
        aps: {
          sound: string;
          badge?: number;
        };
      };
    };
  };
}

// Generate JWT for Firebase service account authentication
async function createServiceAccountJWT(): Promise<string> {
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKeyPem = Deno.env.get('FIREBASE_PRIVATE_KEY');
  
  if (!clientEmail || !privateKeyPem) {
    throw new Error('Firebase service account credentials not configured');
  }

  // Decode the private key (handle escaped newlines from env)
  const privateKey = privateKeyPem.replace(/\\n/g, '\n');
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const headerData = new TextEncoder().encode(JSON.stringify(header));
  const payloadData = new TextEncoder().encode(JSON.stringify(payload));
  const encodedHeader = base64url(headerData.buffer as ArrayBuffer);
  const encodedPayload = base64url(payloadData.buffer as ArrayBuffer);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key and sign
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64url(signature as ArrayBuffer);
  return `${unsignedToken}.${encodedSignature}`;
}

// Exchange JWT for OAuth2 access token
async function getAccessToken(): Promise<string> {
  const jwt = await createServiceAccountJWT();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');

    // SECURITY: Verify caller is admin or service-role
    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      // Not service-role — check if caller is admin
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Check admin role
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await supabaseService
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        console.warn(`[Push] Non-admin user ${user.id} attempted to call send-push-notification`);
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!projectId) {
      console.error('FIREBASE_PROJECT_ID not configured');
      return new Response(JSON.stringify({ error: 'Push notifications not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: PushPayload = await req.json();
    const { type, user_ids, radius_km, center_lat, center_lng, title, body, data, environment = 'production' } = payload;

    console.log('[Push] Sending notification:', { type, userCount: user_ids?.length, environment });

    // Get target tokens
    let tokens: { id: string; token: string; user_id: string; platform: string }[] = [];

    if (user_ids && user_ids.length > 0) {
      const { data: tokenData, error } = await supabase
        .from('device_push_tokens')
        .select('id, token, user_id, platform')
        .in('user_id', user_ids)
        .eq('is_active', true)
        .eq('environment', environment);

      if (error) throw error;
      tokens = tokenData || [];
    } else if (radius_km && center_lat && center_lng && type === 'new_meal_nearby') {
      const { data: nearbyProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, latitude, longitude, notification_radius')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (profileError) throw profileError;

      const nearbyUserIds = (nearbyProfiles || [])
        .filter(profile => {
          if (!profile.latitude || !profile.longitude) return false;
          const userRadius = profile.notification_radius || 5;
          const distance = calculateDistance(center_lat, center_lng, profile.latitude, profile.longitude);
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
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active tokens found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Push] Found ${tokens.length} tokens to notify`);

    // Get OAuth2 access token for FCM v1 API
    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const results = await Promise.allSettled(
      tokens.map(async (tokenRecord) => {
        const message: FCMv1Message = {
          message: {
            token: tokenRecord.token,
            notification: { title, body },
            data: { ...data, type, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
            android: {
              priority: 'high',
              notification: { sound: 'default', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
            },
            apns: {
              payload: { aps: { sound: 'default' } },
            },
          },
        };

        const response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();
        const success = response.ok;

        // Log the notification
        await supabase.from('push_notification_logs').insert({
          user_id: tokenRecord.user_id,
          token_id: tokenRecord.id,
          notification_type: type,
          title,
          body,
          data: data || {},
          status: success ? 'sent' : 'failed',
          error_message: result.error?.message || null,
          environment,
          sent_at: new Date().toISOString(),
        });

        // Handle invalid tokens (UNREGISTERED, INVALID_ARGUMENT for bad token)
        if (result.error?.code === 404 || result.error?.details?.some((d: any) => 
          d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
        )) {
          await supabase
            .from('device_push_tokens')
            .update({ is_active: false })
            .eq('id', tokenRecord.id);
          console.log(`[Push] Deactivated invalid token: ${tokenRecord.id}`);
        }

        return { tokenId: tokenRecord.id, success, result };
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

serve(handler);
