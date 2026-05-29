# 🏗️ Precision Project Flow — App Overview & Marketplace

**Platform:** iOS & Android (React Native 0.84.1)  
**Website:** precisionprojectflow.com  
**Backend:** Supabase + Stripe  

---

## What is Precision Project Flow?

Precision Project Flow (PPF) is a **B2B engineering & industrial marketplace** connecting verified suppliers, contractors, and engineering professionals across civil, mechanical, electrical, manufacturing, construction, and logistics sectors.

PPF provides a mobile-first platform where industrial companies can discover services, post jobs, request parts, collaborate via a professional feed, and transact securely using a token-based credit system.

---

## 📱 App Screens & Features

### 🏠 Home Screen
The main dashboard and entry point for the platform.
- Platform stats: 10,000+ verified suppliers, 50+ countries served, 98% satisfaction rate
- **Category browser** across 8 engineering verticals:
  - 🏗️ Civil Engineering (2,847 listings)
  - ⚙️ Mechanical Engineering (3,421 listings)
  - ⚡ Electrical Engineering (2,156 listings)
  - 🤖 Controls & Automation (1,893 listings)
  - 🏭 Manufacturing (4,102 listings)
  - 🔨 Construction Services (3,654 listings)
  - 📦 Material Handling (1,567 listings)
  - 🚚 Logistics & Supply Chain (2,234 listings)
- **Featured suppliers**: Top-rated companies (Bechtel, AECOM, Fluor, etc.)
- Quick navigation to all platform sections

---

### 🛒 Marketplace Screen
The core B2B service discovery and procurement engine.
- **Search bar** — full-text search across all services and providers
- **Category filters**: All, Civil, Mechanical, Electrical, Controls, Manufacturing, Construction, Logistics
- **Service cards** showing:
  - Provider name and company
  - Service description
  - Pricing (formatted per service type)
  - Category and tags
- **Pull-to-refresh** for live data updates
- Powered by Supabase real-time data

---

### 📰 Feed Screen
A professional community hub combining multiple content types in one unified stream.

**Post types supported:**
| Type | Description |
|------|-------------|
| 📝 Updates | Company announcements and general updates |
| 🏗️ Project Showcases | Completed or in-progress project highlights |
| 💼 Job Posts | Open positions with apply CTA |
| 🎉 Milestones | Company and project achievements |
| 🔩 Parts Requests | Live RFQ (Request for Quote) with bidding |

**Features:**
- Filter feed by post type (All, Updates, Projects, Jobs, Milestones, Parts)
- Like and comment on posts
- Create new posts directly from the feed
- **Live bidding panel** on Parts Request posts — submit bids in real time
- Infinite scroll with pull-to-refresh
- Powered by PPFFeedSDK → precisionprojectflow.com

---

### 💬 Messages Screen
Real-time direct messaging between platform users.
- Conversation list with all active threads
- Unread message indicators
- Real-time message delivery via Supabase
- Create new conversations with any platform user

---

### 💬 Conversation Screen
Individual message thread view.
- Full chat history
- Real-time message updates
- Send text messages
- Timestamps and read receipts

---

### 📦 Orders Screen
Track and manage orders placed through the marketplace.
- Order history and status tracking
- Order details view
- Status updates (pending, in progress, completed, etc.)

---

### 🪙 Token Screen
The in-app credit system powering premium marketplace actions.

**Token Packages:**
| Package | Tokens | Price |
|---------|--------|-------|
| Starter | 10 tokens | $10.00 |
| Pro ⭐ | 50 tokens | $45.00 |
| Business | 120 tokens | $99.00 |

**Features:**
- Current token balance display
- Purchase tokens via **Stripe** (full payment sheet integration)
- Purchase history log
- Tokens used for premium marketplace actions (featured listings, priority bids, etc.)

---

### 👤 Profile Screen
User and company profile management.
- Display name, bio, and profile photo
- Company association
- Professional details and expertise areas
- Edit profile information
- View public profile as others see it

---

### 🔐 Auth Screen
Account authentication and onboarding.
- Email/password sign up and sign in
- Secure session management via Supabase Auth
- JWT-based API authentication throughout the app

---

## 🏗️ Technical Architecture

### Frontend
- **React Native** 0.84.1 with New Architecture (Hermes enabled)
- **TypeScript** throughout
- **Custom theme** system (Plus Jakarta Sans font, consistent colors/spacing)
- No external navigation library — custom screen state management
- Context-based auth (`AuthContext`)

### Backend (Supabase)
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and token balances |
| `products` | Marketplace product listings |
| `company_profiles` | Company/supplier profiles |
| `conversations` | Message threads |
| `messages` | Individual messages |
| `product_orders` | Order records |
| `token_purchases` | Token purchase history |
| `credit_tokens` | Token credit ledger |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `purchase-tokens` | Stripe payment intent creation |
| `stripe-webhook` | Handle Stripe payment events |
| `notify-feed-post` | Push notifications for feed activity |
| `notify-new-message` | Push notifications for messages |
| `notify-marketplace` | Push notifications for marketplace events |
| `notify-order-status` | Push notifications for order updates |
| `notify-account` | Push notifications for account events |
| `notify-social` | Push notifications for social interactions |

### Payments
- **Stripe React Native SDK** (v0.62.0)
- Full Payment Sheet integration
- Server-side PaymentIntent creation via edge functions
- Webhook processing for payment confirmation

---

## 🌍 Target Market
- Engineering firms and contractors
- Industrial suppliers and manufacturers
- Project managers and procurement teams
- Skilled tradespeople and specialized service providers
- Companies operating across 50+ countries in the industrial sector
