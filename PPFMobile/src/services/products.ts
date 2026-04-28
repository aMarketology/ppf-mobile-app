// Raw fetch — no supabase-js client (hangs in iOS simulator)
import type { Product } from '../lib/types';
import { restGet } from '../lib/restClient';

export const productsService = {
  async getAll(
    jwt: string,
    filters?: {
      category?: string;
      companyId?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<Product[]> {
    const params: string[] = [
      'select=*',
      'is_active=eq.true',
      'order=created_at.desc',
    ];

    if (filters?.companyId) {
      params.push(`company_id=eq.${filters.companyId}`);
    }
    if (filters?.category) {
      params.push(`category=eq.${encodeURIComponent(filters.category)}`);
    }
    if (filters?.search) {
      const q = encodeURIComponent(`%${filters.search}%`);
      params.push(`or=(name.ilike.${q},description.ilike.${q})`);
    }
    if (filters?.minPrice !== undefined) {
      params.push(`price=gte.${filters.minPrice}`);
    }
    if (filters?.maxPrice !== undefined) {
      params.push(`price=lte.${filters.maxPrice}`);
    }

    return restGet<Product[]>(`products?${params.join('&')}`, jwt);
  },

  async getById(id: string, jwt: string): Promise<Product | null> {
    const rows = await restGet<Product[]>(
      `products?select=*&id=eq.${id}&limit=1`,
      jwt,
    );
    return rows[0] ?? null;
  },

  /** Format cents to dollar string e.g. 45900 → "$459.00" */
  formatPrice(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};
