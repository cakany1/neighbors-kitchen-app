import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Unit tests for Stripe webhook signature verification logic
 * No environment variables required - tests pure cryptographic logic
 */

Deno.test("Stripe signature: HMAC-SHA256 signature generation", async () => {
  const webhookSecret = "whsec_test_1234567890abcdef";
  const payload = JSON.stringify({
    id: "evt_test",
    type: "checkout.session.completed",
    livemode: false
  });
  const timestamp = 1707206400;

  const signature = await generateStripeSignature(payload, timestamp, webhookSecret);

  // Stripe signatures have format: t=<timestamp>,v1=<hash>
  assertStringIncludes(signature, "t=1707206400");
  assertStringIncludes(signature, "v1=");
  
  console.log("✅ HMAC-SHA256 signature generated correctly");
  console.log(`   Format: ${signature.substring(0, 50)}...`);
});

Deno.test("Stripe signature: Same payload produces same signature", async () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_1", type: "charge.refunded" });
  const timestamp = 1707206400;

  const sig1 = await generateStripeSignature(payload, timestamp, secret);
  const sig2 = await generateStripeSignature(payload, timestamp, secret);

  assertEquals(sig1, sig2, "Identical inputs should produce identical signatures");
  console.log("✅ Deterministic signature generation verified");
});

Deno.test("Stripe signature: Different payloads produce different signatures", async () => {
  const secret = "whsec_test_secret";
  const timestamp = 1707206400;

  const payload1 = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const payload2 = JSON.stringify({ id: "evt_2", type: "charge.refunded" });

  const sig1 = await generateStripeSignature(payload1, timestamp, secret);
  const sig2 = await generateStripeSignature(payload2, timestamp, secret);

  assertEquals(sig1 !== sig2, true, "Different payloads must produce different signatures");
  console.log("✅ Different payloads verified to produce different signatures");
});

Deno.test("Stripe signature: Wrong secret produces different signature", async () => {
  const payload = JSON.stringify({ id: "evt_test", type: "charge.refunded" });
  const timestamp = 1707206400;

  const correctSecret = "whsec_correct_secret_123";
  const wrongSecret = "whsec_wrong_secret_456";

  const correctSig = await generateStripeSignature(payload, timestamp, correctSecret);
  const wrongSig = await generateStripeSignature(payload, timestamp, wrongSecret);

  assertEquals(correctSig !== wrongSig, true, "Different secrets must produce different signatures");
  console.log("✅ Wrong secret produces different signature - tampering would be detected");
});

Deno.test("Stripe signature: Modified payload would fail verification", async () => {
  const secret = "whsec_test_secret";
  const timestamp = 1707206400;

  const originalPayload = JSON.stringify({
    id: "evt_test",
    type: "checkout.session.completed",
    amount: 1000
  });

  const tamperedPayload = JSON.stringify({
    id: "evt_test",
    type: "checkout.session.completed",
    amount: 2000  // Tampered!
  });

  const originalSig = await generateStripeSignature(originalPayload, timestamp, secret);
  const tamperedSig = await generateStripeSignature(tamperedPayload, timestamp, secret);

  assertEquals(originalSig !== tamperedSig, true, "Tampered payload must produce different signature");
  console.log("✅ Payload tampering would be detected");
});

Deno.test("Stripe webhook mode detection: livemode flag", () => {
  const testEvent = { livemode: false };
  const liveEvent = { livemode: true };

  const testMode = testEvent.livemode ? "live" : "test";
  const liveMode = liveEvent.livemode ? "live" : "test";

  assertEquals(testMode, "test");
  assertEquals(liveMode, "live");
  console.log("✅ Mode detection correctly identifies test vs live from livemode flag");
});

Deno.test("Stripe webhook secret priority logic", () => {
  // Test the secret selection logic
  function selectWebhookSecret(
    mode: "test" | "live" | null,
    testSecret?: string,
    liveSecret?: string,
    fallbackSecret?: string
  ): string | null {
    if (mode === "live" && liveSecret) return liveSecret;
    if (mode === "test" && testSecret) return testSecret;
    return fallbackSecret || null;
  }

  // Case 1: TEST mode with mode-specific secret
  assertEquals(
    selectWebhookSecret("test", "whsec_test_123", "whsec_live_456", "whsec_fallback"),
    "whsec_test_123"
  );

  // Case 2: LIVE mode with mode-specific secret
  assertEquals(
    selectWebhookSecret("live", "whsec_test_123", "whsec_live_456", "whsec_fallback"),
    "whsec_live_456"
  );

  // Case 3: TEST mode without mode-specific secret, falls back
  assertEquals(
    selectWebhookSecret("test", undefined, "whsec_live_456", "whsec_fallback"),
    "whsec_fallback"
  );

  // Case 4: No secret available
  assertEquals(
    selectWebhookSecret("test", undefined, undefined, undefined),
    null
  );

  console.log("✅ Webhook secret priority correctly handles test/live mode selection");
});

Deno.test("Stripe signature verification: Valid signature passes", async () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_123", type: "charge.refunded" });
  const timestamp = 1707206400;

  // Generate signature (as if from Stripe)
  const validSignature = await generateStripeSignature(payload, timestamp, secret);

  // Verify signature (stripe-webhook function would do this)
  const isValid = await verifyStripeSignature(payload, validSignature, secret);

  assertEquals(isValid, true, "Valid signature should pass verification");
  console.log("✅ Valid Stripe signature passes verification");
});

Deno.test("Stripe signature verification: Invalid signature fails", async () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_123", type: "charge.refunded" });

  // Use a fake/invalid signature
  const invalidSignature = "t=1707206400,v1=0000000000000000000000000000000000000000000000000000000000000000";

  // Verify signature
  const isValid = await verifyStripeSignature(payload, invalidSignature, secret);

  assertEquals(isValid, false, "Invalid signature should fail verification");
  console.log("✅ Invalid Stripe signature correctly fails verification");
});

Deno.test("Stripe signature verification: Tampered payload with valid signature fails", async () => {
  const secret = "whsec_test_secret";
  const timestamp = 1707206400;

  const originalPayload = JSON.stringify({ id: "evt_123", amount: 1000 });
  const tamperedPayload = JSON.stringify({ id: "evt_123", amount: 5000 });

  // Sign original payload
  const signature = await generateStripeSignature(originalPayload, timestamp, secret);

  // Try to verify tampered payload with original signature
  const isValid = await verifyStripeSignature(tamperedPayload, signature, secret);

  assertEquals(isValid, false, "Tampered payload should fail verification even with valid signature");
  console.log("✅ Tampered payload correctly fails signature verification");
});

/**
 * Generate Stripe webhook signature
 * Format: t=<timestamp>,v1=<HMAC-SHA256-hex>
 */
async function generateStripeSignature(
  payload: string,
  timestamp: number,
  secret: string
): Promise<string> {
  const signedContent = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();

  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(signedContent)
  );

  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return `t=${timestamp},v1=${hexSignature}`;
}

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse signature header: t=<timestamp>,v1=<hash>
    const parts = signature.split(",");
    if (parts.length < 2) return false;

    const timestampPart = parts.find(p => p.startsWith("t="));
    const signaturePart = parts.find(p => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.substring(2);
    const expectedHash = signaturePart.substring(3);

    // Reconstruct signed content
    const signedContent = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();

    // HMAC-SHA256
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const computedSignature = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(signedContent)
    );

    const computedHash = Array.from(new Uint8Array(computedSignature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison (prevents timing attacks)
    return constantTimeCompare(computedHash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
