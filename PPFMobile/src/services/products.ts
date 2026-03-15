import { supabase } from '../lib/supabase';
import type { Product } from '../lib/types';

export const productsService = {
  async getAll(filters?: {
    category?: string;
    companyId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, company:company_profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, company:company_profiles(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Format cents to dollar string e.g. 45900 → "$459.00" */
  formatPrice(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};
