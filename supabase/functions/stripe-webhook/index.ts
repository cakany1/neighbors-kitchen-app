import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

// Stripe webhooks come from Stripe's servers, not browsers, so no CORS needed
// But we still need to verify the signature

const logStep = (step: string, details?: Record<string, unknown>) => {
  const safeDetails = details ? JSON.stringify(details) : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${safeDetails ? ` - ${safeDetails}` : ''}`);
};

serve(async (req) => {
  // Only POST method allowed for webhooks
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    logStep('Webhook received');

    // Get required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      logStep('ERROR: Missing STRIPE_SECRET_KEY');
      return new Response('Server configuration error', { status: 500 });
    }

    if (!webhookSecret) {
      logStep('ERROR: Missing STRIPE_WEBHOOK_SECRET');
      return new Response('Server configuration error', { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep('ERROR: Missing Supabase configuration');
      return new Response('Server configuration error', { status: 500 });
    }

    // CRITICAL: Get the Stripe signature header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logStep('ERROR: Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    // Get the raw request body for signature verification
    const body = await req.text();
    logStep('Received body length', { length: body.length });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // CRITICAL: Verify webhook signature using constructEventAsync for Deno
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      logStep('Signature verification PASSED', { eventType: event.type, eventId: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep('ERROR: Signature verification FAILED', { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { status: 400 });
    }

    // Create Supabase admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep('Processing checkout.session.completed', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerId: session.customer,
        });

        // Only process if payment was successful
        if (session.payment_status !== 'paid') {
          logStep('Payment not completed, skipping', { status: session.payment_status });
          break;
        }

        // Extract metadata
        const mealId = session.metadata?.meal_id;
        const userId = session.metadata?.user_id;
        const chefContribution = session.metadata?.chef_contribution;

        if (!mealId || !userId) {
          logStep('WARNING: Missing metadata', { mealId, userId });
          break;
        }

        // Find the booking and update payment status
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id')
          .eq('meal_id', mealId)
          .eq('guest_id', userId)
          .eq('status', 'confirmed')
          .single();

        if (findError || !booking) {
          logStep('WARNING: Booking not found', { mealId, userId, error: findError?.message });
          break;
        }

        // Update booking with payment info
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_amount: chefContribution ? parseInt(chefContribution) : session.amount_total,
            payout_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) {
          logStep('ERROR: Failed to update booking', { bookingId: booking.id, error: updateError.message });
        } else {
          logStep('SUCCESS: Booking payment recorded', { bookingId: booking.id, amount: chefContribution });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep('Payment intent succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
        });
        // Additional handling if needed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep('Payment intent failed', {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        // Could notify user or log for review
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        logStep('Charge refunded', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
        });
        // Update booking payout_status if needed
        break;
      }

      default:
        logStep('Unhandled event type', { type: event.type });
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true, type: event.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR: Unexpected error', { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
