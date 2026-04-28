// Raw fetch — no supabase-js client (hangs in iOS simulator)
import type { CompanyProfile } from '../lib/types';
import { restGet } from '../lib/restClient';

export const companiesService = {
  async getAll(
    jwt: string,
    filters?: {
      category?: string;
      search?: string;
      verified?: boolean;
      limit?: number;
    },
  ): Promise<CompanyProfile[]> {
    const params: string[] = ['select=*', 'order=created_at.desc'];

    if (filters?.verified !== undefined) {
      params.push(`is_verified=eq.${filters.verified}`);
    }
    if (filters?.search) {
      const q = encodeURIComponent(`%${filters.search}%`);
      params.push(`or=(company_name.ilike.${q},description.ilike.${q})`);
    }
    if (filters?.category) {
      params.push(`specialties=cs.{${encodeURIComponent(filters.category)}}`);
    }
    if (filters?.limit) {
      params.push(`limit=${filters.limit}`);
    }

    return restGet<CompanyProfile[]>(`company_profiles?${params.join('&')}`, jwt);
  },

  async getById(id: string, jwt: string): Promise<CompanyProfile | null> {
    const rows = await restGet<CompanyProfile[]>(
      `company_profiles?select=*&id=eq.${id}&limit=1`,
      jwt,
    );
    return rows[0] ?? null;
  },

  async getByOwner(userId: string, jwt: string): Promise<CompanyProfile | null> {
    const rows = await restGet<CompanyProfile[]>(
      `company_profiles?select=*&owner_id=eq.${userId}&limit=1`,
      jwt,
    );
    return rows[0] ?? null;
  },

  async getFeatured(jwt: string, limit = 6): Promise<CompanyProfile[]> {
    return restGet<CompanyProfile[]>(
      `company_profiles?select=*&is_verified=eq.true&limit=${limit}`,
      jwt,
    );
  },
};
