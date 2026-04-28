// Raw fetch — no supabase-js client (hangs in iOS simulator)
import type { Order } from '../lib/types';
import { restGet } from '../lib/restClient';

export const ordersService = {
  async getMyOrders(userId: string, jwt: string): Promise<Order[]> {
    return restGet<Order[]>(
      `orders?select=id,client_id,engineer_id,service_id,status,total_amount,stripe_payment_intent_id,created_at,completed_at&or=(client_id.eq.${userId},engineer_id.eq.${userId})&order=created_at.desc`,
      jwt,
    );
  },

  async getStats(userId: string, jwt: string) {
    const orders = await restGet<{ status: string; total_amount: number }[]>(
      `orders?select=status,total_amount&or=(client_id.eq.${userId},engineer_id.eq.${userId})`,
      jwt,
    );
    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((sum: number, o) => sum + o.total_amount, 0);
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending' || o.status === 'active').length,
      totalSpentCents: totalSpent,
    };
  },

  /** Format cents to dollar string e.g. 45900 → "$459.00" */
  formatPrice(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};
