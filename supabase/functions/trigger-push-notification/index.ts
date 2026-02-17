import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingUpdatePayload {
  booking_id: string;
  event: 'confirmed' | 'cancelled' | 'pickup_reminder' | 'rating_reminder';
  actor_id?: string; // Who triggered the event (to exclude from notification)
}

interface NewMealPayload {
  meal_id: string;
  chef_id: string;
  title: string;
  fuzzy_lat: number;
  fuzzy_lng: number;
  radius_km?: number;
}

type TriggerPayload = 
  | { type: 'booking_update'; data: BookingUpdatePayload }
  | { type: 'new_meal_nearby'; data: NewMealPayload };

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create authenticated client to verify caller
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

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TriggerPayload = await req.json();

    let pushPayload: {
      type: string;
      user_ids?: string[];
      radius_km?: number;
      center_lat?: number;
      center_lng?: number;
      title: string;
      body: string;
      data?: Record<string, string>;
    };

    if (payload.type === 'booking_update') {
      const { booking_id, event, actor_id } = payload.data;

      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_id,
          meal:meals(
            id,
            title,
            chef_id,
            scheduled_date
          )
        `)
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      // Safely handle the meal object from the nested query
      if (!booking.meal || typeof booking.meal !== 'object' || Array.isArray(booking.meal)) {
        throw new Error('Invalid booking meal data');
      }

      const meal = booking.meal as { id: string; title: string; chef_id: string; scheduled_date: string };
      
      // Determine who to notify
      const notifyUserIds: string[] = [];
      
      if (event === 'confirmed' || event === 'cancelled') {
        // Notify both chef and guest, except actor
        if (meal.chef_id !== actor_id) notifyUserIds.push(meal.chef_id);
        if (booking.guest_id !== actor_id) notifyUserIds.push(booking.guest_id);
      } else if (event === 'pickup_reminder' || event === 'rating_reminder') {
        // Notify guest
        notifyUserIds.push(booking.guest_id);
      }

      const titles: Record<string, string> = {
        confirmed: 'Buchung bestätigt',
        cancelled: 'Buchung storniert',
        pickup_reminder: 'Abholung bald',
        rating_reminder: 'Bewertung ausstehend',
      };

      const bodies: Record<string, string> = {
        confirmed: `Deine Buchung für "${meal.title}" wurde bestätigt.`,
        cancelled: `Die Buchung für "${meal.title}" wurde storniert.`,
        pickup_reminder: `Vergiss nicht, "${meal.title}" heute abzuholen!`,
        rating_reminder: `Wie war "${meal.title}"? Gib jetzt eine Bewertung ab.`,
      };

      pushPayload = {
        type: 'booking_update',
        user_ids: notifyUserIds,
        title: titles[event] || 'Buchungs-Update',
        body: bodies[event] || `Update zu "${meal.title}"`,
        data: {
          booking_id,
          meal_id: meal.id,
          event,
          route: `/meal/${meal.id}`,
        },
      };

    } else if (payload.type === 'new_meal_nearby') {
      const { meal_id, chef_id, title, fuzzy_lat, fuzzy_lng, radius_km = 10 } = payload.data;

      pushPayload = {
        type: 'new_meal_nearby',
        radius_km,
        center_lat: fuzzy_lat,
        center_lng: fuzzy_lng,
        title: 'Neues Gericht in deiner Nähe',
        body: `"${title}" ist jetzt verfügbar!`,
        data: {
          meal_id,
          chef_id,
          route: `/meal/${meal_id}`,
        },
      };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid payload type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call the main push notification function
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushPayload),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({
      success: true,
      push_result: pushResult,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Push Trigger] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
