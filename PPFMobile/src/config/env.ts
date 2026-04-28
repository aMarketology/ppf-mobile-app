/**
 * Central environment configuration.
 *
 * All values come from react-native-config which reads the .env file
 * at build time (native) and at Metro bundling time (JS).
 *
 * To switch environments:
 *   iOS:     ENVFILE=.env.production npx react-native run-ios
 *   Android: ENVFILE=.env.production npx react-native run-android
 *   CI:      set ENVFILE in the build step
 *
 * Never import secrets directly from elsewhere — always use this module.
 */
import Config from 'react-native-config';

function require_env(key: string): string {
  const value = (Config as Record<string, string | undefined>)[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
      'Copy .env.example → .env and fill in the values.',
    );
  }
  return value;
}

export const ENV = {
  /** "development" | "staging" | "production" */
  APP_ENV: Config.APP_ENV ?? 'development',

  // ─── Supabase ────────────────────────────────────────────────────────────
  SUPABASE_URL:      require_env('SUPABASE_URL'),
  SUPABASE_ANON_KEY: require_env('SUPABASE_ANON_KEY'),

  // ─── Stripe (public key only — secret key lives in Edge Functions) ────────
  STRIPE_PUBLISHABLE_KEY: require_env('STRIPE_PUBLISHABLE_KEY'),

  // ─── Monitoring ──────────────────────────────────────────────────────────
  /** Sentry DSN — optional in dev, required in production */
  SENTRY_DSN: Config.SENTRY_DSN ?? '',

  // ─── Analytics ───────────────────────────────────────────────────────────
  ANALYTICS_TOKEN: Config.ANALYTICS_TOKEN ?? '',

  // ─── Backend (Supabase Edge Functions base URL) ───────────────────────────
  API_URL: Config.API_URL ?? `${Config.SUPABASE_URL}/functions/v1`,

  // ─── Helpers ─────────────────────────────────────────────────────────────
  isDev:        (Config.APP_ENV ?? 'development') === 'development',
  isProduction: Config.APP_ENV === 'production',
} as const;
