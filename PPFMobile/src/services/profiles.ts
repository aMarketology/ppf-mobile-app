// Raw fetch — no supabase-js client (hangs in iOS simulator)
import type { Profile } from '../lib/types';
import { restGet, restPatch } from '../lib/restClient';

export const profilesService = {
  async getProfile(userId: string, jwt: string): Promise<Profile | null> {
    const rows = await restGet<Profile[]>(
      `profiles?select=*&id=eq.${userId}&limit=1`,
      jwt,
    );
    return rows[0] ?? null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>, jwt: string): Promise<Profile> {
    const rows = await restPatch<Profile[]>(
      `profiles?id=eq.${userId}`,
      updates,
      jwt,
    );
    if (!rows[0]) throw new Error('Update failed');
    return rows[0];
  },
};
