// ─── Profiles ────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'client' | 'engineer' | 'vendor' | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  company_id: string | null;
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
  delivery_time?: string | null;
  service_area?: string | null;
  images?: string[] | null;
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

// ─── Site Activities (Blockchain-style audit ledger) ─────────────────────────

export type ActivityType =
  | 'rfq_posted'
  | 'rfq_awarded'
  | 'offer_submitted'
  | 'social_post_created'
  | 'order_placed'
  | 'order_completed'
  | 'company_joined'
  | 'team_member_added';

export interface ActivityActor {
  full_name: string;
  avatar_url: string | null;
  user_type: string;
}

export interface SiteActivity {
  id: string;
  activity_type: ActivityType;
  actor_id: string;
  target_type: string | null;
  target_id: string | null;
  summary: string;
  metadata: Record<string, any> | null;
  previous_hash: string | null;
  row_hash: string;
  created_at: string;
  // client-side enriched
  actor: ActivityActor;
}

export interface ActivityPage {
  activities: SiteActivity[];
  page: number;
  hasMore: boolean;
  total: number;
}

export interface ActivityFilter {
  key: ActivityType | 'all';
  label: string;
  icon: string;
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

// ─── RFQ (Request for Quote) ─────────────────────────────────────────────────

export type RfqStatus = 'open' | 'in_review' | 'awarded' | 'closed';
export type RfqTypeField = 'product' | 'service';

export interface RfqClient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company_name: string | null;
}

export interface Rfq {
  id: string;
  slug: string | null;
  client_id: string;
  title: string;
  rfq_type: RfqTypeField;
  category: string;
  description: string;
  quantity: string | null;
  budget: string | null;
  timeline: string | null;
  location: string | null;
  material: string | null;
  attachment_urls: string[] | null;
  nda_required: boolean;
  is_asap: boolean;
  line_items: Record<string, any>[] | null;
  status: RfqStatus;
  created_at: string;
  updated_at: string;
  // enriched by fetchRfqs (mobile mirrors desktop API)
  client: RfqClient | null;
  offers_count: number;
  lowest_offer: number | null;
  my_offer: number | null;
}

export interface RfqOffer {
  id: string;
  rfq_id: string;
  vendor_id: string;
  amount: number;
  notes: string | null;
  delivery_days: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  conversation_id: string | null;
  message_id: string | null;
  created_at: string;
  // enriched
  vendor?: Profile;
}

export interface RfqPage {
  rfqs: Rfq[];
  page: number;
  hasMore: boolean;
  total: number;
}
