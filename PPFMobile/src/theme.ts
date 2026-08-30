/**
 * PPF Brand Theme — Deep Blue + Orange
 *
 * Per BRANDING.md:
 *   • Primary Blue (#003D82) — trust, authority, main UI
 *   • Accent Orange (#FF6B35) — one CTA per screen max
 *   • Plus Jakarta Sans — single typeface, 5 weights
 *
 * Key names preserved for backward compat:
 *   mint → primary blue, mintDark → hover, mintLight → blue-50
 */

export const colors = {
  // ─── Primary Blue (was "mint") — main UI, buttons, links, nav ───────
  mint:      '#003D82',  // primary
  mintDark:  '#002960',  // primary hover
  mintLight: '#EFF6FF',  // blue-50 background
  mintMid:   '#BFDBFE',  // blue-200 borders

  // ─── Accent Orange — CTA buttons, one per screen max ────────────────
  accent:       '#FF6B35',
  accentHover:  '#E55A2B',
  accentLight:  '#FFF7ED',  // orange-50

  // ─── Neutrals ───────────────────────────────────────────────────────
  bg:           '#F8FAFC',
  white:        '#FFFFFF',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textMuted:    '#9CA3AF',
  border:       '#E2E8F0',
  card:         '#FFFFFF',

  // ─── Status ─────────────────────────────────────────────────────────
  success:  '#10B981',  // emerald
  warning:  '#F59E0B',  // amber
  error:    '#EF4444',  // red
  info:     '#3B82F6',  // blue

  // ─── Legacy alias ───────────────────────────────────────────────────
  blue: '#3B82F6',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Plus Jakarta Sans — use these instead of raw fontFamily strings
export const fonts = {
  regular:   'PlusJakartaSans-Regular',
  medium:    'PlusJakartaSans-Medium',
  semiBold:  'PlusJakartaSans-SemiBold',
  bold:      'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
};

/**
 * Shared elevation presets — matches AuthScreen.
 * Use shadows.button on primary CTAs, shadows.card on floating cards.
 */
export const shadows = {
  button: {
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logo: {
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
