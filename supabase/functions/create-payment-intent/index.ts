import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, mealId, mealTitle, chefName } = await req.json();

    // Validate minimum amount (CHF 7.00 = 700 cents)
    if (!amount || amount < 700) {
      return new Response(
        JSON.stringify({ error: "Minimum amount is CHF 7.00" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client for user auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    let userEmail = null;
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email;
      userId = data.user?.id;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate fees
    const serviceFee = 200; // CHF 2.00 = 200 cents
    const totalAmount = amount + serviceFee;

    // Create Checkout Session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: mealTitle || "Nachbarschafts-Gericht",
              description: `Beitrag an ${chefName || "deinen Nachbarn"}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: "Servicegebühr",
              description: "Plattform-Betrieb & Sicherheit",
            },
            unit_amount: serviceFee,
          },
          quantity: 1,
        },
      ],
      metadata: {
        meal_id: mealId || "",
        user_id: userId || "",
        chef_contribution: amount.toString(),
        service_fee: serviceFee.toString(),
      },
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment/${mealId}`,
    });

    console.log("Payment session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
