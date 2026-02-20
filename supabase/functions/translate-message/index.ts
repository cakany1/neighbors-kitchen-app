/**
 * Translate Message Edge Function
 * 
 * Features:
 * - Uses shared utils for CORS, auth, and logging
 * - Origin validation for production security
 * - Uses Lovable AI for translation
 */

import { 
  getCorsHeaders, 
  handleCors,
  generateRequestId,
  safeLog,
  verifyAuth,
  checkOrigin,
  jsonError,
  withTimeout
} from '../_shared/utils.ts'

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  const origin = req.headers.get('Origin');
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // PRODUCTION SECURITY: Validate origin
  const originError = checkOrigin(req, requestId);
  if (originError) return originError;

  // Server-side limits
  const MAX_TRANSLATION_LENGTH = 5000;
  const MIN_TRANSLATION_LENGTH = 1;

  try {
    // Authentication check
    const auth = await verifyAuth(req, requestId);
    if (!auth.success) {
      return auth.response!;
    }

    const { text, targetLanguage, sourceLanguage } = await req.json();
    
    // Input validation - server-side enforcement
    if (!text || typeof text !== 'string') {
      safeLog(requestId, 'warn', 'Invalid input: missing or invalid text');
      return jsonError('Text is required', 400, requestId, undefined, origin);
    }
    
    const trimmedText = text.trim();
    
    if (trimmedText.length < MIN_TRANSLATION_LENGTH) {
      safeLog(requestId, 'warn', 'Input too short', { length: trimmedText.length });
      return jsonError('Text is too short', 400, requestId, undefined, origin);
    }
    
    if (trimmedText.length > MAX_TRANSLATION_LENGTH) {
      safeLog(requestId, 'warn', 'Input too long', { length: trimmedText.length, max: MAX_TRANSLATION_LENGTH });
      return jsonError(`Text exceeds maximum length of ${MAX_TRANSLATION_LENGTH} characters`, 400, requestId, undefined, origin);
    }

    if (!targetLanguage || !sourceLanguage) {
      return jsonError('Source and target language are required', 400, requestId, undefined, origin);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    safeLog(requestId, 'info', 'Translating message', { 
      from: sourceLanguage, 
      to: targetLanguage, 
      textLength: trimmedText.length,
      userId: auth.user?.id 
    });

    const response = await withTimeout(
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else. Keep the same tone and style.`
            },
            {
              role: "user",
              content: trimmedText
            }
          ],
        }),
      }),
      25_000,
      requestId
    );

    if (!response.ok) {
      const errorText = await response.text();
      safeLog(requestId, 'error', 'Translation API error', { status: response.status, error: errorText });
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;

    safeLog(requestId, 'info', 'Translation successful');

    return new Response(
      JSON.stringify({ translatedText, originalText: text, requestId }),
      { headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    safeLog(requestId, 'error', 'Translation error', { error: message });
    return jsonError(message, 500, requestId, undefined, origin);
  }
});
