/**
 * scan-receipt — Supabase Edge Function for OCR receipt scanning.
 *
 * Accepts a receipt image, sends it to Google Cloud Vision API for OCR,
 * parses the extracted text into structured fields (vendor, date, total, line items),
 * and stores the result in the `receipts` table.
 *
 * Environment variables required:
 *   GOOGLE_CLOUD_VISION_API_KEY — API key for Google Cloud Vision
 *   SUPABASE_URL — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key for DB writes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptData {
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: number;
  tax_amount?: number;
  subtotal?: number;
  line_items?: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  ocr_raw_text: string;
  ocr_confidence: number;
}

/**
 * Parse raw OCR text into structured receipt fields using regex patterns.
 */
function parseReceiptText(text: string): ReceiptData {
  const result: ReceiptData = {
    ocr_raw_text: text,
    ocr_confidence: 0.85,
    line_items: [],
  };

  // Vendor name — usually first few lines, before "Address" or "Date"
  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    if (
      cleaned.length > 2 &&
      !cleaned.match(/^\d+/) &&
      !cleaned.toLowerCase().includes('address') &&
      !cleaned.toLowerCase().includes('date') &&
      !cleaned.toLowerCase().includes('receipt') &&
      !cleaned.toLowerCase().includes('invoice') &&
      !cleaned.toLowerCase().includes('thank you')
    ) {
      result.vendor_name = cleaned;
      break;
    }
  }

  // Transaction date
  const dateMatch = text.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
  );
  if (dateMatch) {
    result.transaction_date = dateMatch[0];
  }

  // Total amount — look for "total", "amount due", "balance"
  const totalMatch = text.match(
    /(?:total|amount\s*due|balance|grand\s*total)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  );
  if (totalMatch) {
    result.total_amount = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // Tax amount
  const taxMatch = text.match(
    /(?:tax|sales\s*tax|hst|gst|vat)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  );
  if (taxMatch) {
    result.tax_amount = parseFloat(taxMatch[1].replace(/,/g, ''));
  }

  // Subtotal
  const subMatch = text.match(
    /(?:subtotal|sub\s*total)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  );
  if (subMatch) {
    result.subtotal = parseFloat(subMatch[1].replace(/,/g, ''));
  }

  // Line items — look for lines with quantity, description, and price
  const lineItemRegex = /(\d+)\s+(.+?)\s+\$?([\d,]+\.?\d{0,2})\s+\$?([\d,]+\.?\d{0,2})/g;
  let itemMatch;
  while ((itemMatch = lineItemRegex.exec(text)) !== null) {
    result.line_items!.push({
      quantity: parseInt(itemMatch[1], 10),
      description: itemMatch[2].trim(),
      unit_price: parseFloat(itemMatch[3].replace(/,/g, '')),
      total: parseFloat(itemMatch[4].replace(/,/g, '')),
    });
  }

  return result;
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

    // Parse request body
    const { image_base64, image_url, project_id, project_name, job_number, cost_code, cost_code_desc, notes } = await req.json();

    if (!image_base64 && !image_url) {
      return new Response(JSON.stringify({ error: 'image_base64 or image_url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Google Cloud Vision API
    const visionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    let ocrText = '';
    let confidence = 0.85;

    if (visionApiKey) {
      try {
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
                  features: [{ type: 'TEXT_DETECTION' }],
                },
              ],
            }),
          },
        );

        const visionData = await visionResponse.json();
        if (visionResponse.ok) {
          ocrText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
          confidence = visionData.responses?.[0]?.textAnnotations?.[0]?.confidence || 0.85;
        } else {
          console.warn('Vision API error, using empty text fallback:', visionData);
        }
      } catch (visionErr) {
        console.warn('Vision API request failed, using fallback:', visionErr);
      }
    } else {
      console.warn('GOOGLE_CLOUD_VISION_API_KEY not configured. Returning pending receipt for manual review.');
    }

    // Parse the OCR text into structured data
    const parsed = parseReceiptText(ocrText);
    parsed.ocr_confidence = confidence;

    // Store in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get user ID from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        job_number: job_number || project_name || null,
        vendor_name: parsed.vendor_name || 'Receipt Expense',
        transaction_date: parsed.transaction_date || new Date().toISOString().split('T')[0],
        total_amount: parsed.total_amount || null,
        tax_amount: parsed.tax_amount || null,
        subtotal: parsed.subtotal || null,
        line_items: parsed.line_items || [],
        cost_code: cost_code || null,
        cost_code_desc: cost_code_desc || null,
        notes: notes || null,
        ocr_raw_text: parsed.ocr_raw_text || '',
        ocr_confidence: parsed.ocr_confidence,
        status: ocrText ? 'processed' : 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ receipt, parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});