# PPF Mobile — Feature Test Checklist

> Step-by-step manual testing against live Supabase (`ifrxzmemiihxfdimwvcw`).
> Check off items as verified on the physical Android device (SM-A156U, Android 15).
> **Last Updated:** September 10, 2026

---

## 1. Auth & Onboarding

- [x] App launches and shows loading splash
- [x] Signed-out users see the Auth screen (Sign In / Sign Up toggle)
- [x] Password visibility toggle (eye icon) works
- [x] Keyboard moves fields into view while typing
- [ ] Sign In with valid credentials succeeds *(test on device)*
- [ ] Sign In with wrong credentials shows error *(test on device)*
- [x] Sign Up creates account *(verified via API)*
- [ ] Forgot password sends reset email *(test on device)*
- [ ] Sign Out returns to Auth screen *(test on device)*
- [ ] Session persists across app restarts *(test on device)*

## 2. Activity Feed (Live Ledger)

- [x] Signed-in users land on Feed by default
- [x] Feed loads live `site_activities` from Supabase *(3,979 events)*
- [x] Shows actor name + relative time
- [x] Shows summary text
- [x] Shows budget / location / category metadata tags
- [x] Shows SHA256 hash preview
- [x] Shows "View RFQ" / "See Bid" links on RFQ activities
- [x] Filter pills work
- [x] Search works
- [x] Pull-to-refresh works
- [x] Load more pagination
- [x] Realtime insert appears at top
- [x] Hash chain info footer renders

## 3. Shop (Services Marketplace)

- [x] Shop tab opens with service listing *(3 results)*
- [x] Services load live data with price + provider
- [x] Search filters results
- [x] Category filter pills work
- [x] Service card tap → **Detail View** *(PLC Programming opens correctly)*
- [x] Detail view shows provider card, stats, tags
- [x] Detail view shows "Request Quote · 75 tokens" CTA with balance
- [ ] Request Quote creates DM and deducts tokens *(test on device)*
- [x] "+" Post button visible in hero header
- [ ] Post Service form submits to database *(test on device)*

## 4. RFQ Marketplace

- [x] RFQ tab opens with browsing *(2 open RFQs)*
- [x] RFQs load live data with status tags
- [x] "Bid" button opens Submit Offer screen
- [x] Create RFQ 4-step wizard works
- [x] RFQ posts to Supabase `rfqs` table
- [x] New RFQ appears in Marketplace + Activity feed

## 5. Submit Offer (Bidding)

- [x] Token cost banner shows balance
- [x] Insufficient tokens blocks submission + shows Buy Tokens
- [x] Owner cannot bid on own RFQ
- [x] Amount validation (> $0)
- [x] Offer submits → 50 tokens deducted
- [x] Token balance refreshes after submit
- [x] Activity feed logs `offer_submitted`

## 6. Messaging

- [ ] Messages tab loads conversations *(test on device)*
- [ ] Conversation list shows partner + last message *(test on device)*
- [ ] Chat screen loads messages *(test on device)*
- [ ] Send text message works (optimistic + persisted) *(test on device)*
- [ ] Realtime messages appear *(test on device)*
- [ ] Typing indicator broadcasts *(test on device)*
- [ ] Unread badge on TabBar *(test on device)*
- [ ] Token-gated unlock modal shows *(test on device)*

## 7. Profile & Settings

- [x] Profile tab renders user info
- [x] Token balance displays correctly
- [x] Company Profile screen loads
- [x] Settings screen loads with Profile / Security / Notifications / Privacy tabs
- [ ] Profile editing saves to database *(test on device)*
- [ ] Password change works *(test on device)*
- [ ] Sign Out works *(test on device)*

## 8. Tokens

- [x] Token balance display in header + profile
- [x] Token store lists packs
- [x] Token badge tappable → Token screen

## 9. Orders *(Not Yet Implemented)*

- [ ] Purchase service (requires Stripe flow)
- [ ] View order confirmation
- [ ] View client orders
- [ ] View vendor sales

---

## 📝 Notes

- **Test Account:** `vendor.test@precisionprojectflow.com` / `VendorTest2026!` (500 tokens)
- **Package name:** `com.precisionprojectflow.mobile`
- **Device:** Samsung SM-A156U running Android 15
- **Supabase:** `ifrxzmemiihxfdimwvcw.supabase.co` — 3,979 activities, 3 services, 2 open RFQs
- **Last Build:** September 10, 2026 — ServiceDetail + Request Quote DM flow added
