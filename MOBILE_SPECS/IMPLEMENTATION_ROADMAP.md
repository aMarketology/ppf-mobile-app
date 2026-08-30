# PPF Mobile — Step-by-Step Implementation Roadmap

> **Repository:** `ppf-mobile-app` (branch: `main`)
> **Framework:** React Native 0.84 + Expo SDK 54 + TypeScript
> **Database:** Supabase Postgres (tables already exist in production)
> **Date:** August 21, 2026
> **App entry:** [`PPFMobile/App.tsx`](../PPFMobile/App.tsx)

---

## Architecture Summary

The existing app is a **tab-based** single-screen switcher (no stack navigator yet). All features share:

| Shared Infrastructure | File |
|-----------------------|------|
| Theme (colors, fonts, spacing) | [`PPFMobile/src/theme.ts`](../PPFMobile/src/theme.ts) |
| Types | [`PPFMobile/src/lib/types.ts`](../PPFMobile/src/lib/types.ts) |
| Supabase client (auth + realtime) | [`PPFMobile/src/lib/supabase.ts`](../PPFMobile/src/lib/supabase.ts) |
| REST client (PostgREST) | [`PPFMobile/src/lib/restClient.ts`](../PPFMobile/src/lib/restClient.ts) |
| Auth context (session + profile) | [`PPFMobile/src/context/AuthContext.tsx`](../PPFMobile/src/context/AuthContext.tsx) |
| Environment config | [`PPFMobile/src/config/env.ts`](../PPFMobile/src/config/env.ts) |
| Tab bar navigation | [`PPFMobile/src/components/TabBar.tsx`](../PPFMobile/src/components/TabBar.tsx) |

**Key constraint:** Services must use `restGet/restPost` from `restClient.ts`, NOT `supabase.from(...)`. The supabase-js client causes AsyncStorage hangs in the iOS simulator.

---

## Phase 1: Activity Feed ✅ COMPLETED

> **Spec:** [`MOBILE_SPECS/activity-feed.md`](./activity-feed.md)

### What was built
| File | Purpose |
|------|---------|
| `src/lib/types.ts` (updated) | Added `SiteActivity`, `ActivityType`, `ActivityActor`, `ActivityPage`, `ActivityFilter` |
| `src/services/activities.ts` | `fetchActivities()` + `subscribeToActivities()` (WebSocket realtime) |
| `src/screens/ActivityFeedScreen.tsx` | Full activity feed with hero, filter pills, search, cards, hash chain info |
| `src/screens/HomeScreen.tsx` (updated) | Condensed mini-feed strip (4 activities) |
| `App.tsx` (updated) | `'Activity'` case in renderScreen switch |
| `src/components/TabBar.tsx` (updated) | Added `🔗 Activity` tab |

### To verify
- [ ] Run app and navigate to Activity tab
- [ ] Verify `site_activities` table has data in Supabase
- [ ] Test filter pills (All / RFQs / Offers / Awarded / Orders / etc.)
- [ ] Test search bar
- [ ] Test pull-to-refresh
- [ ] Test "Load More" pagination
- [ ] Test real-time (insert a row in Supabase dashboard, see it appear live)
- [ ] Verify home page mini-feed loads (if `session` is active)

---

## Phase 2: Messaging System ✅ IN PROGRESS

> **Spec:** [`MOBILE_SPECS/messages.md`](./messages.md)
> **Priority:** HIGH — Core communication feature

### Completed
| File | Purpose |
|------|---------|
| `src/services/messages.ts` (updated) | Added `subscribeToMessages()` (WebSocket realtime), `fetchUnreadCount()`, `markMessagesRead()`, `broadcastTyping()`, `unlockConversation()` |
| `src/screens/ConversationScreen.tsx` (updated) | Real-time message subscription, optimistic sending (temp IDs), typing broadcast, mark-as-read on view |
| `src/screens/MessagesScreen.tsx` (updated) | Unread badge counters on conversation rows, `fetchUnreadCount` integration |
| `src/components/UnlockModal.tsx` (new) | Token-gated DM unlock modal with balance check and buy-tokens CTA |
| `src/components/RFQOfferCard.tsx` (new) | In-chat RFQ offer card — bidder view, client locked, client unlocked with Send Contract / Schedule Meeting |

### Remaining
- [ ] **2.1** Company panel section (show company name, team members, pending invites)
- [ ] **2.2** Section tabs: All / Channels / Groups / DMs
- [ ] **2.3** "Create Group" modal with member search
- [ ] **2.4** "Create Channel" modal (public/private toggle)
- [ ] **2.5** Company invite cards — Accept/Decline inline buttons
- [ ] **2.6** Wire UnlockModal into ConversationScreen for locked DMs
- [ ] **2.7** Wire RFQOfferCard into ConversationScreen message list
- [ ] **2.8** Load more messages on scroll up (pagination)

#### 2.1 Conversation Sidebar (in `MessagesScreen.tsx`)
- [ ] **2.1a** Company panel section (show company name, team members, pending invites)
- [ ] **2.1b** Section tabs: All / Channels / Groups / DMs (horizontal pill filter)
- [ ] **2.1c** Search conversations by name
- [ ] **2.1d** "New DM" button → user search modal → `get_or_create_conversation` RPC
- [ ] **2.1e** "Create Group" modal with member search
- [ ] **2.1f** "Create Channel" modal (public/private toggle, name, description)
- [ ] **2.1g** Unread badge counters (red pill with count)
- [ ] **2.1h** Real-time sidebar updates (new message → reorder, unread count change)

#### 2.2 Chat Panel (in `ConversationScreen.tsx` or inline)
- [ ] **2.2a** Header bar with back button, conversation name, active status
- [ ] **2.2b** Settings gear (channels/groups only) → rename, manage members, delete
- [ ] **2.2c** Message bubbles — own right-aligned (blue), others left-aligned (white)
- [ ] **2.2d** System messages — centered gray
- [ ] **2.2e** Company invite cards — Accept/Decline inline buttons
- [ ] **2.2f** Optimistic sending — temp ID → replace on API success, revert on error
- [ ] **2.2g** Real-time message subscription (per-conversation WebSocket)
- [ ] **2.2h** Typing indicators — Supabase broadcast, debounced 2s, "X is typing..."
- [ ] **2.2i** Load more messages on scroll up (pagination)

#### 2.3 Token-Gated DM Unlock
- [ ] **2.3a** Detect locked conversation (`isFree` check: unlocked/friends/same-company/applicant)
- [ ] **2.3b** Unlock modal — "Unlock for 100 tokens" with token pack options
- [ ] **2.3c** Call `spend_tokens()` RPC → set `is_unlocked = true` on conversation
- [ ] **2.3d** Handle "insufficient_tokens" → redirect to Token purchase screen

#### 2.4 RFQ Offer Cards (in chat)
- [ ] **2.4a** Detect `message_type === 'rfq_offer'` in message list
- [ ] **2.4b** Render special offer card — title, vendor, amount, delivery days, note
- [ ] **2.4c** Locked state (client view) — 🔒 "Unlock for 50 tokens"
- [ ] **2.4d** Unlocked state — full details + "Send Contract" / "Schedule Meeting" buttons
- [ ] **2.4e** Bidder view — blue banner "Application sent. Owner can review."

#### 2.5 Company Invites
- [ ] **2.5a** "Invite Member" button in company panel
- [ ] **2.5b** User search → send invite (POST with companyId + targetUserId)
- [ ] **2.5c** Render invite system messages with Accept/Decline
- [ ] **2.5d** Accept → `accept_company_invite()` RPC → user joins company
- [ ] **2.5e** Decline → `decline_company_invite()` RPC

---

## Phase 3: RFQ Marketplace ✅ IN PROGRESS

> **Spec:** [`MOBILE_SPECS/rfq.md`](./rfq.md)
> **Priority:** HIGH — Core B2B workflow

### Completed
| File | Purpose |
|------|---------|
| `src/lib/types.ts` (updated) | Added `Rfq`, `RfqOffer`, `RfqPage`, `RfqStatus`, `RfqTypeField` |
| `src/services/rfq.ts` (refactored) | Uses shared types, `fetchRfqs()`, `fetchRfqById()`, `fetchRfqOffers()`, `getRfqCategories()` |
| `src/screens/RFQMarketplaceScreen.tsx` (new) | Full RFQ marketplace — hero, search, status/type/category filters, sort, "For You" toggle, RFQ cards with bid/details |
| `App.tsx` (updated) | Marketplace tab now renders `RFQMarketplaceScreen` |

### Remaining
- [ ] **3.1** RFQ Detail Screen (`RFQDetailScreen.tsx`) — hero, description, line items, attachments, offers list
- [ ] **3.2** Create RFQ Screen (`CreateRFQScreen.tsx`) — multi-step form
- [ ] **3.3** "For You" scoring algorithm (client-side matching)
- [ ] **3.4** Expandable offers panel per RFQ card
- [ ] **3.5** Client profile enrichment on RFQ cards

---

## Phase 4: RFQ Offer Application Flow

> **Spec:** [`MOBILE_SPECS/rfq-application.md`](./rfq-application.md)
> **Priority:** MEDIUM — Depends on Phase 3 (RFQ Marketplace)

### What needs to be built

#### 4.1 Submit Offer Screen
- [ ] **4.1a** RFQ summary card at top (budget, timeline, category, location, description excerpt)
- [ ] **4.1b** Line items table (if RFQ has line items)
- [ ] **4.1c** Offer form — Amount ($), Delivery days, Company name (auto-filled), Contact name (auto-filled), Phone, Per-part pricing inputs, Notes
- [ ] **4.1d** Pre-check validations: authenticated, not RFQ owner, not same company, RFQ is open, no existing pending offer, ≥ 50 tokens
- [ ] **4.1e** Submit → `submit_rfq_offer()` RPC (deducts 50 tokens) → DM auto-created → RFQ offer message posted
- [ ] **4.1f** Success screen — ✅ animation, offer amount, "50 tokens deducted" notice, back to RFQ / dashboard

#### 4.2 Client Unlock Flow
- [ ] **4.2a** Locked offer card in chat — 🔒 "Unlock for 50 tokens"
- [ ] **4.2b** Unlock → 50 tokens deducted → full details revealed
- [ ] **4.2c** "Send Contract" button (50 tokens, Stripe Connect checkout)
- [ ] **4.2d** "Schedule Meeting" button (50 tokens, sends invite to DM)

---

## Phase 5: Token Economy

> **Spec:** [`MOBILE_SPECS/messages.md`](./messages.md) (token-gated unlock) + [`MOBILE_SPECS/rfq-application.md`](./rfq-application.md) (offer submission)
> **Priority:** MEDIUM — Supports phases 2-4

### Current state
| File | Status |
|------|--------|
| `src/screens/TokenScreen.tsx` | ✅ Exists |
| `src/services/tokens.ts` | ✅ Exists |

### What needs to be built/improved
- [ ] **5.1** `spendTokens(userId, amount, description, referenceId)` — call `spend_tokens` RPC
- [ ] **5.2** `addTokens(userId, amount, description, stripePaymentId)` — call `add_tokens` RPC
- [ ] **5.3** `refundTokens(userId, amount, description, referenceId)` — call `refund_tokens` RPC
- [ ] **5.4** Token balance display (header/profile)
- [ ] **5.5** "Insufficient tokens" flow — redirect/offer token purchase
- [ ] **5.6** Token purchase integration — Stripe PaymentSheet → add tokens → update balance

---

## Phase 6: Navigation Upgrade

> **Priority:** HIGH — Needed before RFQ Detail/Create screens

### Current state
The app uses a simple `switch(activeTab)` renderer in `App.tsx`. No stack navigator exists
for push/pop navigation to detail screens.

### What needs to be built
- [ ] **6.1** Install `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
- [ ] **6.2** Replace `TabBar` component with React Navigation bottom tab navigator
- [ ] **6.3** Add stack navigators for each tab (e.g., MarketplaceStack: MarketplaceList → RFQDetail → SubmitOffer)
- [ ] **6.4** Pass `navigation` prop instead of `onNavigate` callback
- [ ] **6.5** Deep link support — `ppf://rfq/{id}`, `ppf://messages/{conversationId}`

---

## Phase 7: Polish & Launch

> **Priority:** HIGH — Pre-launch

- [ ] **7.1** Push notifications (FCM for Android, APNs for iOS)
- [ ] **7.2** Pull-to-refresh on all lists
- [ ] **7.3** Empty states for all screens
- [ ] **7.4** Error boundaries and graceful degradation
- [ ] **7.5** Loading skeletons (not spinners)
- [ ] **7.6** Offline detection and caching
- [ ] **7.7** App icon and splash screen final
- [ ] **7.8** EAS Build config verification (iOS + Android)
- [ ] **7.9** TestFlight / Internal Testing track submission
- [ ] **7.10** Production App Store / Google Play submission

---

## Dependencies Between Phases

```
Phase 1 (Activity Feed) ✅ DONE
    ↓
Phase 2 (Messaging) ← Phase 5 (Token Economy) shared
    ↓
Phase 3 (RFQ Marketplace)
    ↓
Phase 4 (RFQ Offer Flow)
    ↓
Phase 6 (Navigation Upgrade) ← should happen alongside Phase 3
    ↓
Phase 7 (Polish & Launch)
```

---

## Quick Reference: RPCs Used

| RPC | Purpose | Used In |
|-----|---------|---------|
| `get_or_create_conversation(u1, u2)` | Create/find DM | Phase 2 |
| `spend_tokens(user, amount, desc, ref)` | Deduct tokens | Phase 2, 4, 5 |
| `add_tokens(user, amount, desc, payment)` | Credit tokens | Phase 5 |
| `refund_tokens(user, amount, desc, ref)` | Refund tokens | Phase 5 |
| `submit_rfq_offer(rfq, vendor, amount, notes, timeline, terms)` | Submit bid | Phase 4 |
| `are_friends(u1, u2)` | Check friend status | Phase 2 |
| `same_company(u1, u2)` | Check same company | Phase 2, 4 |
| `accept_company_invite(company_id)` | Accept invite | Phase 2 |
| `decline_company_invite(company_id)` | Decline invite | Phase 2 |

---

## Files to Create (by phase)

### Phase 2 — Messaging
```
src/services/messages.ts          (update existing)
src/screens/MessagesScreen.tsx    (update existing)
src/components/UnlockModal.tsx    (new)
src/components/OfferCard.tsx      (new)
src/components/InviteCard.tsx     (new)
```

### Phase 3 — RFQ Marketplace
```
src/services/rfq.ts               (new)
src/screens/RFQMarketplaceScreen.tsx   (new)
src/screens/RFQDetailScreen.tsx        (new)
src/screens/CreateRFQScreen.tsx        (new)
src/components/RFQCard.tsx             (new)
src/components/LineItemsTable.tsx      (new)
```

### Phase 4 — RFQ Application
```
src/screens/SubmitOfferScreen.tsx (new)
src/components/OfferForm.tsx      (new)
src/components/OfferSuccess.tsx   (new)
```

### Phase 6 — Navigation
```
PPFMobile/src/navigation/        (new folder)
PPFMobile/src/navigation/AppNavigator.tsx
PPFMobile/src/navigation/types.ts
```

---

## Next Action

**Start Phase 2 (Messaging)** — this is the most complex feature and touches tokens,
real-time, and RFQ offer cards. Let's begin with the conversation sidebar improvements
and chat panel refinements.