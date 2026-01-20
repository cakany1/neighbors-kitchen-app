import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// In-memory rate limit store (per edge function instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  // Clean up expired entries
  if (userLimit && now > userLimit.resetTime) {
    rateLimitStore.delete(userId);
  }

  const currentLimit = rateLimitStore.get(userId);

  if (!currentLimit) {
    // First request in this window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (currentLimit.count >= RATE_LIMIT_REQUESTS) {
    // Rate limit exceeded
    const resetIn = currentLimit.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  // Increment counter
  currentLimit.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_REQUESTS - currentLimit.count, 
    resetIn: currentLimit.resetTime - now 
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
    };

    if (!rateLimit.allowed) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString()
          } 
        }
      );
    }

    const { street, city, postalCode } = await req.json();

    if (!street || !city) {
      return new Response(
        JSON.stringify({ error: 'Street and city are required' }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build address query for Nominatim
    const addressQuery = `${street}, ${postalCode || ''} ${city}, Switzerland`.trim();
    console.log('Geocoding address for user:', user.id, 'Query:', addressQuery);

    // Call OpenStreetMap Nominatim API (free, no API key needed)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1&countrycodes=ch`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'NeighborsKitchen/1.0 (Food sharing app for Basel)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      console.log('No geocoding results found for:', addressQuery);
      return new Response(
        JSON.stringify({ 
          error: 'Address not found',
          latitude: null,
          longitude: null
        }),
        { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = results[0];
    const latitude = parseFloat(location.lat);
    const longitude = parseFloat(location.lon);

    console.log('Geocoded successfully:', { latitude, longitude, address: location.display_name });

    return new Response(
      JSON.stringify({
        latitude,
        longitude,
        display_name: location.display_name,
      }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
