// Services service — raw fetch, no supabase-js client (hangs in iOS simulator)
import type { Service, Profile } from '../lib/types';
import { restGet } from '../lib/restClient';

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
