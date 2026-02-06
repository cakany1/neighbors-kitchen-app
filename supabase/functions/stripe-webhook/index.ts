import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

// Stripe webhooks come from Stripe's servers, not browsers, so no CORS needed
// But we still need to verify the signature

const logStep = (step: string, details?: Record<string, unknown>) => {
  const safeDetails = details ? JSON.stringify(details) : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${safeDetails ? ` - ${safeDetails}` : ''}`);
};

/**
 * Determines Stripe mode from the event or secret key prefix
 * Test events have IDs starting with 'evt_' and objects with 'test' in livemode
 */
function determineStripeMode(event: Stripe.Event): 'test' | 'live' {
  // Stripe events have a livemode boolean property
  return event.livemode ? 'live' : 'test';
}

/**
 * Get the correct webhook secret based on mode
 * Supports both environment-specific secrets and fallback to generic secret
 */
function getWebhookSecret(mode: 'test' | 'live' | null): string | null {
  // Try mode-specific secrets first
  if (mode === 'live') {
    const liveSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');
    if (liveSecret) return liveSecret;
  }
  
  if (mode === 'test') {
    const testSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
    if (testSecret) return testSecret;
  }
  
  // Fall back to generic secret (for backwards compatibility)
  return Deno.env.get('STRIPE_WEBHOOK_SECRET') || null;
}

serve(async (req) => {
  // Only POST method allowed for webhooks
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    logStep('Webhook received');

    // Get required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey) {
      logStep('ERROR: Missing STRIPE_SECRET_KEY');
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

    // Create Supabase admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Try to determine mode from a preliminary parse (before signature verification)
    // We'll verify with the correct secret based on mode
    let preliminaryEvent: Stripe.Event | null = null;
    let stripeMode: 'test' | 'live' = 'test';
    
    try {
      // Parse event without verification to determine mode
      preliminaryEvent = JSON.parse(body) as Stripe.Event;
      stripeMode = preliminaryEvent.livemode ? 'live' : 'test';
      logStep('Detected Stripe mode from payload', { mode: stripeMode, livemode: preliminaryEvent.livemode });
    } catch {
      logStep('WARN: Could not parse preliminary event, defaulting to test mode');
    }

    // Get the appropriate webhook secret for this mode
    const webhookSecret = getWebhookSecret(stripeMode);
    
    if (!webhookSecret) {
      logStep('ERROR: No webhook secret configured', { mode: stripeMode });
      
      // Record the failed event
      await supabase.from('stripe_webhook_events').insert({
        event_id: preliminaryEvent?.id || 'unknown',
        event_type: preliminaryEvent?.type || 'unknown',
        stripe_mode: stripeMode,
        success: false,
        error_message: `No webhook secret configured for ${stripeMode} mode`,
        payload_summary: { attempted_mode: stripeMode }
      });
      
      return new Response(`Server configuration error: No secret for ${stripeMode} mode`, { status: 500 });
    }

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
      
      // Confirm mode from verified event
      stripeMode = determineStripeMode(event);
      logStep('Signature verification PASSED', { 
        eventType: event.type, 
        eventId: event.id,
        mode: stripeMode,
        livemode: event.livemode
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep('ERROR: Signature verification FAILED', { error: errorMessage, attemptedMode: stripeMode });
      
      // Record the failed verification attempt
      await supabase.from('stripe_webhook_events').insert({
        event_id: preliminaryEvent?.id || 'unknown',
        event_type: preliminaryEvent?.type || 'unknown',
        stripe_mode: stripeMode,
        success: false,
        error_message: `Signature verification failed: ${errorMessage}`,
        payload_summary: { error: errorMessage }
      });
      
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { status: 400 });
    }

    // Log the successful webhook receipt
    const payloadSummary: Record<string, unknown> = {
      event_type: event.type,
      livemode: event.livemode,
    };

    // Handle different event types
    let processingError: string | null = null;
    
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          payloadSummary.session_id = session.id;
          payloadSummary.payment_status = session.payment_status;
          payloadSummary.customer_id = session.customer;
          
          logStep('Processing checkout.session.completed', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            customerId: session.customer,
            mode: stripeMode,
          });

          // Only process if payment was successful
          if (session.payment_status !== 'paid') {
            logStep('Payment not completed, skipping', { status: session.payment_status });
            payloadSummary.skipped = true;
            payloadSummary.skip_reason = 'Payment not completed';
            break;
          }

          // Extract metadata
          const mealId = session.metadata?.meal_id;
          const userId = session.metadata?.user_id;
          const chefContribution = session.metadata?.chef_contribution;

          if (!mealId || !userId) {
            logStep('WARNING: Missing metadata', { mealId, userId });
            payloadSummary.warning = 'Missing metadata';
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
            payloadSummary.warning = 'Booking not found';
            break;
          }

          // Update booking with payment info
          // IMPORTANT: In TEST mode, we still update the booking but the payment is simulated
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              payment_amount: chefContribution ? parseInt(chefContribution) : session.amount_total,
              payout_status: stripeMode === 'live' ? 'pending' : 'test_mode',
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            logStep('ERROR: Failed to update booking', { bookingId: booking.id, error: updateError.message });
            processingError = `Failed to update booking: ${updateError.message}`;
            payloadSummary.error = processingError;
          } else {
            logStep('SUCCESS: Booking payment recorded', { 
              bookingId: booking.id, 
              amount: chefContribution,
              mode: stripeMode,
              payoutStatus: stripeMode === 'live' ? 'pending' : 'test_mode'
            });
            payloadSummary.booking_id = booking.id;
            payloadSummary.amount = chefContribution;
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logStep('Payment intent succeeded', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            mode: stripeMode,
          });
          payloadSummary.payment_intent_id = paymentIntent.id;
          payloadSummary.amount = paymentIntent.amount;
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logStep('Payment intent failed', {
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
            mode: stripeMode,
          });
          payloadSummary.payment_intent_id = paymentIntent.id;
          payloadSummary.failure_reason = paymentIntent.last_payment_error?.message;
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          logStep('Charge refunded', {
            chargeId: charge.id,
            amount: charge.amount_refunded,
            mode: stripeMode,
          });
          payloadSummary.charge_id = charge.id;
          payloadSummary.amount_refunded = charge.amount_refunded;
          break;
        }

        default:
          logStep('Unhandled event type', { type: event.type, mode: stripeMode });
          payloadSummary.unhandled = true;
      }
    } catch (processingErr) {
      processingError = processingErr instanceof Error ? processingErr.message : 'Unknown processing error';
      logStep('ERROR: Event processing failed', { error: processingError });
      payloadSummary.processing_error = processingError;
    }

    // Record the webhook event for admin visibility
    const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      stripe_mode: stripeMode,
      success: !processingError,
      error_message: processingError,
      payload_summary: payloadSummary
    });

    if (insertError) {
      logStep('WARN: Failed to record webhook event', { error: insertError.message });
    }

    // Update the current Stripe mode in admin_settings
    await supabase
      .from('admin_settings')
      .upsert({
        setting_key: 'stripe_mode',
        setting_value: JSON.stringify(stripeMode),
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    // Always return 200 to acknowledge receipt (even if processing had issues)
    // Stripe will retry on non-2xx responses
    return new Response(JSON.stringify({ 
      received: true, 
      type: event.type,
      mode: stripeMode,
      success: !processingError
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR: Unexpected error', { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
