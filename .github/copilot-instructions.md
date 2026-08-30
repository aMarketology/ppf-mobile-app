# Copilot Instructions — PPF Mobile App

## NEVER EDIT
Never edit anything inside `/Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/Precision Project Flow/`. That folder is the web reference only — use it for understanding existing patterns, SQL schemas, RPC functions, and business logic, but never modify it.

## Reference-Only
The `Precision Project Flow/` directory contains the production Next.js web app. You may read files there to:
- Understand how a feature works on the web side
- Copy SQL schema or RPC function signatures
- Reference API route patterns
- Check business logic (token costs, message flows, etc.)

## Mobile App Location
All mobile app code lives in `/Users/thelegendofzjui/Documents/GitHub/ppf-mobile-app/PPFMobile/`. This is the only directory you should create or edit files in.

## Key Architecture
- React Native 0.84 with Fabric (New Architecture)
- Supabase backend via raw fetch REST client (`src/lib/restClient.ts`)
- No supabase-js client (causes iOS simulator hangs)
- Theme in `src/theme.ts` (Deep Blue `#003D82`, Orange `#FF6B35`)
- Token-gated features: 75 tokens for new DMs, 50 tokens for RFQ bids