import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Prevent the realtime WebSocket from opening eagerly —
  // it can stall the iOS simulator's HTTP connection pool.
  // Realtime channels are connected explicitly per-screen.
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    // Hard 15-second timeout on every Supabase HTTP call
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timer),
      );
    },
  },
});

// Disconnect the realtime socket immediately — we'll reconnect only when
// a screen actively subscribes (ConversationScreen, etc.)
supabase.realtime.disconnect();
