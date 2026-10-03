/**
 * vision-assist — Supabase Edge Function for AI-assisted content creation.
 *
 * Uses Google Cloud Vision (TEXT_DETECTION + LABEL_DETECTION) to analyze an
 * image and return structured suggestions that help users write better
 * posts and RFQs:
 *
 *   • ocr_text      — raw text found in the image
 *   • suggested_title — a short, punchy title derived from the content
 *   • suggested_body  — a ready-to-edit description
 *   • suggested_tags  — relevant keywords/labels
 *
 * Environment variables required:
 *   GOOGLE_CLOUD_VISION_API_KEY — API key for Google Cloud Vision
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistResult {
  ocr_text: string;
  suggested_title: string;
  suggested_body: string;
  suggested_tags: string[];
}

/**
 * Build a suggested title from the first meaningful line of OCR text.
 */
function suggestTitle(text: string): string {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 3 && !/^\d+$/.test(l));

  for (const line of lines) {
    // Skip obvious headers/footers
    if (/^(date|invoice|receipt|total|subtotal|tax|qty|item|description|thank|www\.|tel:|fax:)/i.test(line)) continue;
    if (line.length > 120) return line.slice(0, 117).trimEnd() + '…';
    return line;
  }
  return 'New project from image';
}

/**
 * Build a suggested body — the OCR text trimmed to a readable paragraph.
 */
function suggestBody(text: string): string {
  const cleaned = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned) return '';
  return cleaned.length > 500 ? cleaned.slice(0, 497).trimEnd() + '…' : cleaned;
}

/**
 * Extract likely tags from OCR text + Vision labels.
 */
function suggestTags(text: string, labels: string[]): string[] {
  const tagSet = new Set<string>();

  // Vision labels are already great tags
  labels.slice(0, 5).forEach(l => tagSet.add(l.toLowerCase()));

  // Look for capitalized multi-word phrases in the OCR text
  const phraseRegex = /([A-Z][a-zA-Z0-9&]+(?:\s+[A-Z][a-zA-Z0-9&]+){0,3})/g;
  const phrases = text.match(phraseRegex) ?? [];
  phrases.slice(0, 8).forEach(p => {
    const t = p.trim();
    if (t.length > 2 && t.length <= 40) tagSet.add(t.toLowerCase());
  });

  return [...tagSet].slice(0, 8);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image_base64, image_url } = await req.json();
    if (!image_base64 && !image_url) {
      return new Response(JSON.stringify({ error: 'image_base64 or image_url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const visionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!visionApiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_CLOUD_VISION_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Call Google Cloud Vision — text + labels in one request
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: image_base64
                ? { content: image_base64 }
                : { source: { imageUri: image_url } },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'LABEL_DETECTION', maxResults: 10 },
              ],
            },
          ],
        }),
      },
    );

    const visionData = await visionResponse.json();
    if (!visionResponse.ok) {
      console.error('Vision API error:', JSON.stringify(visionData));
      return new Response(
        JSON.stringify({ error: 'Vision API request failed', details: visionData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const response = visionData.responses?.[0] ?? {};
    const ocrText = response.fullTextAnnotation?.text ?? '';
    const labels: string[] = (response.labelAnnotations ?? []).map((l: any) => l.description);

    const result: AssistResult = {
      ocr_text: ocrText,
      suggested_title: suggestTitle(ocrText),
      suggested_body: suggestBody(ocrText),
      suggested_tags: suggestTags(ocrText, labels),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});