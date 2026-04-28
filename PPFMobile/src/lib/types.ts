// ─── Profiles ────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'client' | 'engineer' | 'vendor' | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  token_balance: number;
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

// ─── Services (replaces Products) ────────────────────────────────────────────
export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price: number; // in cents
  category: string | null;
  tags: string[] | null;
  active: boolean;
  created_at: string;
  // joined
  provider?: Profile;
}

// ─── Legacy Product (keep for backward compat) ───────────────────────────────
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
export type OrderStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  client_id: string;
  engineer_id: string;
  service_id: string | null;
  status: OrderStatus;
  total_amount: number; // cents
  stripe_payment_intent_id: string | null;
  created_at: string;
  completed_at: string | null;
  // joined
  service?: Service;
  engineer?: Profile;
  client?: Profile;
}

// ─── Legacy ProductOrder (keep for backward compat) ──────────────────────────
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
export interface UserConversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // UI helpers (optional, populated client-side)
  other_user?: Profile;
}

// ─── Messages ────────────────────────────────────────────────────────────────
export interface UserMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // joined
  sender?: Profile;
}

// ─── Feed (synced with ppf-feed-sdk) ─────────────────────────────────────────
export type PostType =
  | 'update'
  | 'project_showcase'
  | 'job_post'
  | 'milestone'
  | 'parts_request';

export interface FeedAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_type: string;
  company_name: string | null;
}

export interface FeedPost {
  id: string;
  content: string;
  post_type: PostType;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  bids_count: number;
  budget: number | null;
  deadline: string | null;
  created_at: string;
  author: FeedAuthor;
  liked_by_me: boolean;
}

export interface FeedBid {
  id: string;
  amount: number;
  note: string | null;
  status: string;
  created_at: string;
  bidder: FeedAuthor;
}

export interface FeedComment {
  id: string;
  content: string;
  created_at: string;
  author: FeedAuthor;
}

export interface FeedPage {
  posts: FeedPost[];
  page: number;
  hasMore: boolean;
}

export interface FeedLike {
  post_id: string;
  user_id: string;
}

// ─── Friends ──────────────────────────────────────────────────────────────────
export type FriendStatus = 'pending' | 'accepted' | 'declined';

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  // joined
  requester?: Profile;
  addressee?: Profile;
}

// ─── Token Purchases ──────────────────────────────────────────────────────────
export interface TokenPurchase {
  id: string;
  user_id: string;
  tokens: number;
  stripe_payment_id: string | null;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}
