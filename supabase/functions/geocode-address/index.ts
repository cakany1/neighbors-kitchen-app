/**
 * Geocode Address Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - DB-based rate limiting
 * - Uses OpenStreetMap Nominatim API (free, no API key needed)
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  checkRateLimit,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError,
  jsonSuccess
} from '../_shared/utils.ts'

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

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
    // Authentication check - require valid user session
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }
    const user = auth.user!;

    // DB-based rate limiting
    const rateLimit = await checkRateLimit(user.id, 'geocode-address', RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS);
    
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
    };

    if (!rateLimit.allowed) {
      safeLog(requestId, 'warn', 'Rate limit exceeded', { userId: user.id });
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
          requestId
        }),
        { 
          status: 429, 
          headers: { 
            ...getCorsHeaders(origin), 
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
          } 
        }
      );
    }

    const { street, city, postalCode } = await req.json();

    if (!street || !city) {
      return jsonError('Street and city are required', 400, requestId, undefined, origin);
    }

    // Build address query for Nominatim
    const addressQuery = `${street}, ${postalCode || ''} ${city}, Switzerland`.trim();
    safeLog(requestId, 'info', 'Geocoding address', { userId: user.id, query: addressQuery });

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
      safeLog(requestId, 'info', 'No geocoding results found', { query: addressQuery });
      // Return success with null coordinates instead of error
      // This allows the frontend to distinguish "not found" from "API error"
      return new Response(
        JSON.stringify({ 
          latitude: null,
          longitude: null,
          display_name: null,
          message: 'Address not found',
          requestId
        }),
        { status: 200, headers: { ...getCorsHeaders(origin), ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = results[0];
    const latitude = parseFloat(location.lat);
    const longitude = parseFloat(location.lon);

    safeLog(requestId, 'info', 'Geocoded successfully', { latitude, longitude });

    return new Response(
      JSON.stringify({
        latitude,
        longitude,
        display_name: location.display_name,
        requestId
      }),
      { headers: { ...getCorsHeaders(origin), ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    safeLog(requestId, 'error', 'Geocoding error', { error: errorMessage });
    return jsonError(errorMessage, 500, requestId, undefined, origin);
  }
});
