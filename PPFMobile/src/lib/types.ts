// ─── Profiles ────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'client' | 'engineer' | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

// ─── Company Profiles ─────────────────────────────────────────────────────────
export interface CompanyProfile {
  id: string;
  owner_id: string | null;
  company_name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  specialties: string[] | null;
  certifications: string[] | null;
  is_verified: boolean;
  is_claimed: boolean;
  created_at: string;
}

// ─── Products ────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  price: number; // in cents
  category: string | null;
  delivery_time_days: number | null;
  is_active: boolean;
  requires_consultation: boolean;
  created_at: string;
  // joined
  company?: CompanyProfile;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface ProductOrder {
  id: string;
  order_number: string;
  product_id: string | null;
  company_id: string | null;
  buyer_id: string | null;
  product_name: string;
  product_price: number; // cents
  platform_fee: number | null;
  total_amount: number; // cents
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  completed_at: string | null;
  // joined
  company?: CompanyProfile;
  product?: Product;
}

// ─── Conversations ────────────────────────────────────────────────────────────
export type ConversationStatus = 'active' | 'archived' | 'resolved';

export interface Conversation {
  id: string;
  created_by: string | null;
  subject: string | null;
  product_id: string | null;
  order_id: string | null;
  company_id: string | null;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
  // joined
  company?: CompanyProfile;
  last_message?: Message;
  unread_count?: number;
}

// ─── Messages ────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Record<string, unknown>[] | null;
  edited_at: string | null;
  is_system_message: boolean;
  created_at: string;
  // joined
  sender?: Profile;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}
