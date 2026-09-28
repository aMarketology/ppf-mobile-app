// Services service — raw fetch, no supabase-js client (hangs in iOS simulator)
import type { Service, Profile } from '../lib/types';
import { restGet, restPost } from '../lib/restClient';
import { ENV } from '../config/env';

export interface ServiceWithProvider extends Service {
  provider?: Profile;
}

/**
 * Fetch active services from the `services` table.
 * Optionally filter by category or search term.
 */
export async function fetchServices(
  jwt: string,
  opts: { category?: string; search?: string; limit?: number } = {},
): Promise<ServiceWithProvider[]> {
  const params: string[] = [
    'select=*',
    'active=eq.true',
    'order=created_at.desc',
  ];

  if (opts.category) {
    params.push(`category=eq.${encodeURIComponent(opts.category)}`);
  }
  if (opts.search) {
    const q = encodeURIComponent(`%${opts.search}%`);
    params.push(`or=(title.ilike.${q},description.ilike.${q})`);
  }
  if (opts.limit) {
    params.push(`limit=${opts.limit}`);
  }

  const services = await restGet<Service[]>(`services?${params.join('&')}`, jwt);

  // Resolve provider profiles
  const providerIds = [...new Set(services.map(s => s.provider_id).filter(Boolean))];
  let profileMap: Record<string, Profile> = {};
  if (providerIds.length > 0) {
    const idList = providerIds.map(id => `"${id}"`).join(',');
    const profiles = await restGet<Profile[]>(
      `profiles?select=id,full_name,email,avatar_url,user_type&id=in.(${idList})`,
      jwt,
    );
    for (const p of profiles) {
      profileMap[p.id] = p;
    }
  }

  return services.map(s => ({
    ...s,
    provider: profileMap[s.provider_id] ?? undefined,
  }));
}

/** Fetch a single service by ID */
export async function fetchServiceById(jwt: string, id: string): Promise<ServiceWithProvider | null> {
  const rows = await restGet<Service[]>(
    `services?select=*&id=eq.${id}&limit=1`,
    jwt,
  );
  const svc = rows[0];
  if (!svc) return null;

  // Resolve provider
  if (svc.provider_id) {
    const profiles = await restGet<Profile[]>(
      `profiles?select=id,full_name,email,avatar_url,user_type&id=eq.${svc.provider_id}&limit=1`,
      jwt,
    );
    return { ...svc, provider: profiles[0] ?? undefined };
  }
  return svc;
}

/** Format price (stored as numeric in DB — could be dollars or cents) */
export function formatServicePrice(price: number): string {
  // DB stores as numeric; treat as dollars
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Upload a base64 data-URI image to Supabase Storage ('service-images' bucket)
 * and return its public URL.
 */
export async function uploadServiceImage(jwt: string, userId: string, dataUri: string): Promise<string | null> {
  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    const contentType = matches[1];
    const base64Data = matches[2];
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${userId}/${Date.now()}.${ext}`;

    const res = await fetch(`${ENV.SUPABASE_URL}/storage/v1/object/service-images/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${jwt}`,
        apikey: ENV.SUPABASE_ANON_KEY,
      },
      body: Uint8Array.from(atobPolyfill(base64Data), c => c.charCodeAt(0)),
    });
    if (!res.ok) {
      console.warn('[services] image upload failed:', await res.text());
      return null;
    }
    return `${ENV.SUPABASE_URL}/storage/v1/object/public/service-images/${filename}`;
  } catch (e) {
    console.warn('[services] image upload error:', e);
    return null;
  }
}

// Minimal base64 decoder (matches feed.ts b64decode)
function atobPolyfill(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '=') break;
    const v = chars.indexOf(c);
    if (v === -1) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Create a new service listing */
export async function createService(
  jwt: string,
  data: {
    provider_id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags?: string[];
    delivery_time?: string;
    service_area?: string;
    images?: string[];
  },
): Promise<Service> {
  const result = await restPost<Service[]>(
    'services?select=*',
    {
      provider_id: data.provider_id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags ?? [],
      delivery_time: data.delivery_time ?? null,
      service_area: data.service_area ?? 'remote',
      images: data.images ?? [],
      active: true,
    },
    jwt,
  );
  return result[0];
}
