/**
 * RFQ service — fetch RFQs from Supabase.
 *
 * Used by RFQ Marketplace, RFQ Detail, and Activity Feed.
 * Uses raw fetch via restClient (never supabase-js — iOS simulator hang).
 *
 * Tables: rfqs, rfq_offers
 */

import type { Profile, Rfq, RfqOffer, RfqStatus, RfqTypeField, RfqPage } from '../lib/types';
import { restGet } from '../lib/restClient';
import { ENV } from '../config/env';

// Re-export for convenience
export type { Rfq, RfqOffer, RfqStatus, RfqTypeField, RfqPage };

const PAGE_SIZE = 20;

const RFQ_CATEGORIES = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Controls & Automation',
  'Manufacturing',
  'Construction Services',
  'Material Handling',
  'Logistics & Supply Chain',
  'Energy & Chemicals',
  'Water Treatment',
  'Mining & Minerals',
  'Aerospace',
  'Automotive',
  'Electronics',
  'Medical Devices',
  'Plastics & Polymers',
  'Metal Fabrication',
  'CNC Machining',
  'Additive Manufacturing',
];

// ─── Fetch RFQs ───────────────────────────────────────────────────────────────

export async function fetchRfqs(
  jwt: string,
  opts: {
    page?: number;
    status?: RfqStatus | 'all';
    rfqType?: RfqTypeField | 'all';
    category?: string;
    search?: string;
    sort?: 'newest' | 'budget_asc';
  } = {},
): Promise<RfqPage> {
  const page = opts.page ?? 0;
  const limit = PAGE_SIZE;
  const offset = page * limit;

  // Decode user ID from JWT for "my offer" lookup
  const userId = jwtUserId(jwt);

  const selectCols = [
    'id','slug','client_id','title','rfq_type','category','description',
    'quantity','budget','timeline','location','material','attachment_urls',
    'nda_required','is_asap','line_items','status','created_at','updated_at',
  ].join(',');

  const params: string[] = [
    `select=${selectCols}`,
    'order=created_at.desc',
    `limit=${limit}`,
    `offset=${offset}`,
  ];

  if (opts.status && opts.status !== 'all') params.push(`status=eq.${opts.status}`);
  if (opts.rfqType && opts.rfqType !== 'all') params.push(`rfq_type=eq.${opts.rfqType}`);
  if (opts.category) params.push(`category=eq.${encodeURIComponent(opts.category)}`);
  if (opts.search) {
    const q = encodeURIComponent(`%${opts.search}%`);
    params.push(`or=(title.ilike.${q},description.ilike.${q},category.ilike.${q},location.ilike.${q})`);
  }

  // ── Fetch RFQs + total count ────────────────────────────────────────────
  const [rows, total] = await Promise.all([
    restGet<any[]>(`rfqs?${params.join('&')}`, jwt),
    fetchRfqCount(jwt, opts),
  ]);

  if (rows.length === 0) return { rfqs: [], page, hasMore: false, total };

  const rfqList = rows as any[];
  const rfqIds = rfqList.map(r => r.id);

  // ── Enrich: client profiles ─────────────────────────────────────────────
  const clientIds = [...new Set(rfqList.map(r => r.client_id).filter(Boolean))];
  let clientMap: Record<string, any> = {};
  if (clientIds.length > 0) {
    const profiles = await restGet<any[]>(
      `profiles?select=id,full_name,avatar_url,user_type,company_id&id=in.(${clientIds.join(',')})`,
      jwt,
    );
    for (const p of profiles) clientMap[p.id] = p;
  }

  // ── Enrich: company names ───────────────────────────────────────────────
  const companyIds = [...new Set(Object.values(clientMap).map((p: any) => p.company_id).filter(Boolean))];
  let companyMap: Record<string, string> = {};
  if (companyIds.length > 0) {
    const companies = await restGet<any[]>(
      `company_profiles?select=id,company_name&id=in.(${companyIds.join(',')})`,
      jwt,
    );
    for (const c of companies) companyMap[c.id] = c.company_name;
  }

  // ── Enrich: offer stats (count + lowest) ────────────────────────────────
  let offerMap: Record<string, { count: number; lowest: number | null }> = {};
  let myOfferMap: Record<string, number> = {};
  if (rfqIds.length > 0) {
    const offerRows = await restGet<any[]>(
      `rfq_offers?select=rfq_id,amount,vendor_id&rfq_id=in.(${rfqIds.join(',')})&status=eq.pending`,
      jwt,
    );
    for (const o of offerRows ?? []) {
      const e = offerMap[o.rfq_id] ?? { count: 0, lowest: null };
      e.count += 1;
      const amt = Number(o.amount);
      if (e.lowest === null || amt < e.lowest) e.lowest = amt;
      offerMap[o.rfq_id] = e;
      if (userId && o.vendor_id === userId) {
        myOfferMap[o.rfq_id] = amt;
      }
    }
  }

  // ── Build enriched output ───────────────────────────────────────────────
  const enriched = rfqList.map(r => {
    const prof = clientMap[r.client_id];
    return {
      ...r,
      client: prof ? {
        id: prof.id,
        full_name: prof.full_name ?? 'Unknown',
        avatar_url: prof.avatar_url ?? null,
        company_name: prof.company_id ? (companyMap[prof.company_id] ?? null) : null,
      } : null,
      offers_count: offerMap[r.id]?.count ?? 0,
      lowest_offer: offerMap[r.id]?.lowest ?? null,
      my_offer: myOfferMap[r.id] ?? null,
    };
  });

  return {
    rfqs: enriched as Rfq[],
    page,
    hasMore: offset + limit < total,
    total,
  };
}

function jwtUserId(jwt: string): string {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const s = (jwt.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    let output = ''; let i = 0;
    while (i < s.length) {
      const enc1 = chars.indexOf(s[i++]); const enc2 = chars.indexOf(s[i++]);
      const enc3 = chars.indexOf(s[i++]); const enc4 = chars.indexOf(s[i++]);
      output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
      if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
    }
    return JSON.parse(output).sub ?? '';
  } catch { return ''; }
}

// ─── Fetch Single RFQ ────────────────────────────────────────────────────────

export async function fetchRfqById(jwt: string, id: string): Promise<Rfq | null> {
  const rows = await restGet<any[]>(
    `rfqs?select=id,slug,client_id,title,rfq_type,category,description,quantity,budget,timeline,location,material,attachment_urls,nda_required,is_asap,line_items,status,created_at,updated_at&id=eq.${id}&limit=1`,
    jwt,
  );
  const rfq = rows[0] ?? null;
  if (rfq?.client_id) {
    const profiles = await restGet<any[]>(
      `profiles?select=id,full_name,avatar_url,user_type,company_id&id=eq.${rfq.client_id}&limit=1`,
      jwt,
    );
    const prof = profiles[0];
    if (prof) {
      let companyName: string | null = null;
      if (prof.company_id) {
        const companies = await restGet<any[]>(
          `company_profiles?select=id,company_name&id=eq.${prof.company_id}&limit=1`,
          jwt,
        );
        companyName = companies[0]?.company_name ?? null;
      }
      rfq.client = {
        id: prof.id,
        full_name: prof.full_name ?? 'Unknown',
        avatar_url: prof.avatar_url ?? null,
        company_name: companyName,
      };
    } else {
      rfq.client = null;
    }
  } else {
    rfq.client = null;
  }
  rfq.offers_count = 0;
  rfq.lowest_offer = null;
  rfq.my_offer = null;
  return rfq as Rfq;
}

// ─── Fetch RFQ Offers ────────────────────────────────────────────────────────

export async function fetchRfqOffers(jwt: string, rfqId: string): Promise<RfqOffer[]> {
  const offers = await restGet<RfqOffer[]>(
    `rfq_offers?select=*&rfq_id=eq.${rfqId}&order=created_at.desc`,
    jwt,
  );
  // Enrich vendors
  const vendorIds = [...new Set(offers.map(o => o.vendor_id))];
  if (vendorIds.length > 0) {
    const profiles = await restGet<Profile[]>(
      `profiles?select=id,full_name,avatar_url,user_type&id=in.(${vendorIds.join(',')})`,
      jwt,
    );
    const map: Record<string, Profile> = {};
    for (const p of profiles) map[p.id] = p;
    for (const o of offers) {
      if (map[o.vendor_id]) (o as any).vendor = map[o.vendor_id];
    }
  }
  return offers;
}

// ─── Total RFQ Count ─────────────────────────────────────────────────────────

async function fetchRfqCount(
  jwt: string,
  opts: { status?: string; rfqType?: string; category?: string; search?: string },
): Promise<number> {
  const params: string[] = [];
  if (opts.status && opts.status !== 'all') params.push(`status=eq.${opts.status}`);
  if (opts.rfqType && opts.rfqType !== 'all') params.push(`rfq_type=eq.${opts.rfqType}`);
  if (opts.category) params.push(`category=eq.${encodeURIComponent(opts.category)}`);
  if (opts.search) {
    const q = encodeURIComponent(`%${opts.search}%`);
    params.push(`or=(title.ilike.${q},description.ilike.${q})`);
  }

  try {
    const res = await fetch(
      `${ENV.SUPABASE_URL}/rest/v1/rfqs?select=id&${params.join('&')}&limit=1`,
      {
        headers: {
          apikey: ENV.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${jwt}`,
          Prefer: 'count=exact',
        },
      },
    );
    return parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0', 10);
  } catch {
    return 0;
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function getRfqCategories(): string[] {
  return RFQ_CATEGORIES;
}