import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { street, city, postalCode } = await req.json();

    if (!street || !city) {
      return new Response(
        JSON.stringify({ error: 'Street and city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build address query for Nominatim
    const addressQuery = `${street}, ${postalCode || ''} ${city}, Switzerland`.trim();
    console.log('Geocoding address:', addressQuery);

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
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
