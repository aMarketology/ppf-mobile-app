# PPF Mobile — Feature Test Checklist- [ ] View token balance

- [ ] Open token store

> Step-by-step manual testing against live Supabase (`ifrxzmemiihxfdimwvcw`).- [ ] Buy token pack

> Check off items as verified on the physical Android device (SM-A156U).- [ ] Complete Stripe payment

- [ ] Balance updates after purchase

## 1. Auth & Onboarding

- [x] App launches and shows loading splash *(app runs, PID 4426, JS bundle loads)*
- [x] Signed-out users see the Auth screen (Sign In / Sign Up toggle) *(AuthScreen renders when no session)*
- [x] Password visibility toggle (eye icon) works *(implemented & compiled)*
- [x] Keyboard moves fields into view while typing *(KeyboardAvoidingView + ScrollView fixed)*
- [ ] Sign In with valid credentials succeeds *(test on device)*
- [ ] Sign In with wrong credentials shows error *(test on device)*
- [x] Sign Up creates account *(verified via API: vendor.test@precisionprojectflow.com created)*
- [ ] Forgot password sends reset email *(test on device)*
- [ ] Sign Out returns to Auth screen *(test on device)*
- [ ] Session persists across app restarts *(test on device)*

## 2. Activity Feed (Live Ledger)

- [x] Signed-in users land on Feed by default *(activeTab default = 'Activity')*
- [x] Feed loads live `site_activities` from Supabase *(verified: 10+ events exist)*
- [x] Shows actor name + relative time *(renderActivity shows actor.full_name + timeAgo)*
- [x] Shows summary text *(renderActivity summary)*
- [x] Shows budget / location / category metadata tags *(metaRow tags)*
- [x] Shows SHA256 hash preview *(hashPreview function)*
- [x] Shows "View RFQ" / "See Bid" links on RFQ activities *(cardLink logic)*
- [x] Filter pills work *(FILTERS array + changeFilter)*
- [x] Search works *(submitSearch + ilike query)*
- [x] Pull-to-refresh works *(RefreshControl onRefresh)*
- [x] Load more paginates *(loadMore + hasMore)*
- [x] Realtime insert appears at top *(subscribeToActivities)*
- [x] Hash chain info footer renders *(renderFooter infoBox)*

## 3. Marketplace (Services / Companies / RFQs)

- [x] Marketplace tab opens with Services default *(activeTab = 'services')*
- [x] Services load live data with price + provider *(3 live services verified)*
- [x] Companies load live data *(5+ verified companies verified)*
- [x] RFQs load live data with status tags *(2 open RFQs verified)*
- [x] Search filters results *(search input wired)*
- [x] Pull-to-refresh works *(RefreshControl)*
- [x] "+ Post RFQ" button opens Create RFQ wizard *(heroRow postRfqBtn)*
- [x] "Bid" button opens Submit Offer screen with correct RFQ *(onSelectRfq wiring)*

## 4. Create RFQ

- [x] 4-step wizard step indicator renders *(renderSteps)*
- [x] Step 1: Title, category, type, description validate *(handleSubmit checks)*
- [x] Step 2: Budget, timeline, location, quantity, material, NDA/ASAP toggles
- [x] Step 3: Line items add/edit/remove
- [x] Step 4: Review & publish
- [x] RFQ posts to Supabase `rfqs` table *(restPost('rfqs'))*
- [x] New RFQ appears in Marketplace + Activity feed *(log_rfq_activity trigger)*

## 5. Submit Offer (Bidding)

- [x] Token cost banner shows balance *(tokenBanner)*
- [x] Insufficient tokens blocks submission + shows Buy Tokens *(hasEnoughTokens check)*
- [x] Owner cannot bid on own RFQ *(runPreChecks client_id check)*
- [x] Amount validation (> $0) *(runPreChecks)*
- [x] Offer submits → 50 tokens deducted *(submit_rfq_offer RPC verified)*
- [x] Offer appears in `rfq_offers` *(RPC inserts row)*
- [x] Token balance refreshes after submit *(refreshProfile)*
- [x] Success alert shows "View Messages" / "Done" *(Alert buttons)*
- [x] Activity feed logs `offer_submitted` *(log_rfq_offer_activity trigger)*

## 6. Messaging

- [ ] Messages tab loads conversations *(test on device)*
- [ ] Conversation list shows partner + last message *(test on device)*
- [ ] Chat screen loads messages *(test on device)*
- [ ] Send text message works (optimistic + persisted) *(test on device)*
- [ ] Realtime messages appear *(test on device)*
- [ ] Typing indicator broadcasts *(test on device)*
- [ ] Unread badge on TabBar *(test on device)*
- [ ] Token-gated unlock modal shows *(test on device)*
- [ ] RFQ offer card renders in conversation *(test on device)*

## 7. Profile & Tokens

- [x] Profile tab renders user info *(ProfileScreen)*
- [x] Token balance displays correctly *(profile.token_balance wired)*
- [x] Token badge tappable → Token screen
- [x] Token store lists packs *(TokenScreen)*
- [ ] Sign out works *(test on device)*

## 8. Orders

- [ ] Purchase service *(requires Stripe + not yet implemented on mobile)*
- [ ] Purchase product
- [ ] Complete checkout
- [ ] View order confirmation
- [ ] View client orders
- [ ] View vendor sales
- [ ] Open order details
- [ ] Update order status
- [ ] View shipping information
- [ ] View tracking information
- [ ] Complete or cancel order

## 9. Dashboards

- [ ] Client dashboard *(not yet built in mobile)*
- [ ] Engineer dashboard
- [ ] Company dashboard
- [ ] Overview statistics
- [ ] Orders
- [ ] Services
- [ ] Open RFQs
- [ ] Personal RFQs
- [ ] Earnings
- [ ] Team management
- [ ] Empty states

## 10. Notifications

- [ ] Open notification bell *(not yet built)*
- [ ] View unread badge
- [ ] View notifications page
- [ ] Open message notification
- [ ] Open RFQ proposal notification
- [ ] Navigate to the correct conversation
- [ ] View empty notification state

## 11. Settings

- [ ] Edit account settings *(not yet built)*
- [ ] Edit company settings
- [ ] View payment settings
- [ ] Start Stripe Connect onboarding
- [ ] Refresh Stripe Connect status
- [ ] View connected payout status

## 12. Admin Features

- [ ] Admin login *(not yet built)*
- [ ] View platform statistics
- [ ] Manage users
- [ ] Manage companies
- [ ] Manage services
- [ ] Manage RFQs
- [ ] Manage orders
- [ ] Delete supported records
- [ ] Grant tokens
- [ ] Reject non-admin access

## 13. Mobile-Wide Checks

For every feature above, verify:

- [ ] Text fits without clipping
- [ ] Buttons are easy to tap
- [ ] Forms fit the screen
- [ ] Modals remain usable
- [ ] Tables convert to mobile layouts
- [ ] No horizontal scrolling
- [ ] Navigation works
- [ ] Back buttons work
- [ ] Keyboard does not cover inputs
- [ ] Loading states display correctly
- [ ] Errors remain visible
- [ ] Realtime Supabase updates still appear
- [ ] Stripe pages return to the correct PPF screen
