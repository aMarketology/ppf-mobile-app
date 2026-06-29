import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  'https://ifrxzmemiihxfdimwvcw.supabase.co';

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlmcnh6bWVtaWloeGZkaW13dmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzYzNDEsImV4cCI6MjA4NzY1MjM0MX0.2_xxH2XZyNrLaRIQBMr2Fr2upn-3CKZuUTf1SVgojvc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // MUST be false in React Native
  },
  global: {
    // Use React Native's built-in fetch instead of whatwg-fetch polyfill
    fetch: fetch.bind(globalThis),
  },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  specialty: string | null;
  user_type: 'engineer' | 'client' | null;
  token_balance: number;
  rating: number | null;
  review_count: number | null;
  push_token: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'quote' | null;
  category: string | null;
  tags: string[] | null;
  images: string[] | null;
  image_url: string | null;
  location: string | null;
  delivery_time: string | null;
  service_area: string | null;
  certifications: string[] | null;
  is_active: boolean;
  active: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface RFQ {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget: number | null;
  timeline: string | null;
  location: string | null;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  last_message_at: string | null;
  other_user?: Profile;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  is_paid: boolean;
  is_system_message: boolean;
  created_at: string;
}
