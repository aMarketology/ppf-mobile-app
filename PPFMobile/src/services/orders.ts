import { supabase } from '../lib/supabase';
import type { ProductOrder } from '../lib/types';

export const ordersService = {
  async getMyOrders(userId: string): Promise<ProductOrder[]> {
    const { data, error } = await supabase
      .from('product_orders')
      .select('*, company:company_profiles(*)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<ProductOrder | null> {
    const { data, error } = await supabase
      .from('product_orders')
      .select('*, company:company_profiles(*), product:products(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('product_orders')
      .select('status, total_amount')
      .eq('buyer_id', userId);
    if (error) throw error;
    const orders = data ?? [];
    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending').length,
      totalSpentCents: totalSpent,
    };
  },
};
