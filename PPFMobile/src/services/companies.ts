import { supabase } from '../lib/supabase';
import type { CompanyProfile } from '../lib/types';

export const companiesService = {
  async getAll(filters?: {
    category?: string;
    search?: string;
    verified?: boolean;
    limit?: number;
  }): Promise<CompanyProfile[]> {
    let query = supabase
      .from('company_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.verified !== undefined) {
      query = query.eq('is_verified', filters.verified);
    }
    if (filters?.search) {
      query = query.or(
        `company_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }
    if (filters?.category) {
      query = query.contains('specialties', [filters.category]);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getByOwner(userId: string): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getFeatured(limit = 6): Promise<CompanyProfile[]> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('is_verified', true)
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
