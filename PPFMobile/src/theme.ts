/**
 * TWS Brand Theme — Light & Dark Mode
 *
 * Two palettes (lightColors / darkColors) share the same token names.
 * The ThemeContext decides which palette is active and persists the
 * user's choice via AsyncStorage.
 *
 * Per BRANDING.md:
 *   • Primary: #0EA5E9 (sky-500)
 *   • Plus Jakarta Sans (headings) + DM Sans (body)
 *   • Borders: white/5 through white/15 (dark) · slate-200 (light)
 */

export type ThemeMode = 'light' | 'dark';

// ─── Dark palette (default — matches current TWS brand) ──────────────────────
export const darkColors = {
  mint:      '#0EA5E9',  // sky-500 — primary
  mintDark:  '#38BDF8',  // sky-400 — hover
  mintLight: '#1E293B',  // slate-800 — tinted bg / avatar bg
  mintMid:   'rgba(255,255,255,0.1)', // white/10 — subtle border

  accent:       '#0EA5E9',
  accentHover:  '#38BDF8',
  accentLight:  '#1E293B',

  // Brand orange — primary CTA / center action button
  orange:       '#FF6B35',
  orangeDark:   '#E55A2B',
  orangeLight:  'rgba(255,107,53,0.15)',

  bg:           '#080808',  // page base
  white:        '#1E293B',  // card surface
  textPrimary:  '#F8FAFC',  // slate-50
  textSecondary:'#94A3B8',  // slate-400
  textMuted:    '#64748B',  // slate-500
  border:       'rgba(255,255,255,0.05)',
  card:         '#1E293B',

  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#0EA5E9',

  blue: '#0EA5E9',
};

// ─── Light palette ───────────────────────────────────────────────────────────
export const lightColors = {
  mint:      '#0EA5E9',  // sky-500 — primary
  mintDark:  '#0284C7',  // sky-600 — hover
  mintLight: '#E0F2FE',  // sky-100 — tinted bg / avatar bg
  mintMid:   '#BAE6FD',  // sky-200 — border

  accent:       '#0EA5E9',
  accentHover:  '#0284C7',
  accentLight:  '#E0F2FE',

  // Brand orange — primary CTA / center action button
  orange:       '#FF6B35',
  orangeDark:   '#E55A2B',
  orangeLight:  'rgba(255,107,53,0.15)',

  bg:           '#F8FAFC',  // page base
  white:        '#FFFFFF',  // card surface
  textPrimary:  '#0F172A',  // slate-900
  textSecondary:'#475569',  // slate-600
  textMuted:    '#94A3B8',  // slate-400
  border:       '#E2E8F0',  // slate-200
  card:         '#FFFFFF',

  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#0EA5E9',

  blue: '#0EA5E9',
};

// ─── Backward-compat default export (dark) ───────────────────────────────────
// Screens that still `import { colors } from '../theme'` keep working (dark).
export const colors = darkColors;

// ─── Shared tokens ───────────────────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
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

export const fonts = {
  regular:   'PlusJakartaSans-Regular',
  medium:    'PlusJakartaSans-Medium',
  semiBold:  'PlusJakartaSans-SemiBold',
  bold:      'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
};

export const bodyFonts = {
  regular:   'DMSans-Regular',
  medium:    'DMSans-Medium',
  italic:    'DMSans-Italic',
};

export type ColorPalette = typeof darkColors;

export interface Shadows {
  button: object;
  card: object;
  logo: object;
}

// ─── Per-mode elevation presets ──────────────────────────────────────────────
export const darkShadows: Shadows = {
  button: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const lightShadows: Shadows = {
  button: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logo: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Backward-compat default shadows (dark).
export const shadows: Shadows = darkShadows;

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
  shadows: Shadows;
}

export function getTheme(mode: ThemeMode): AppTheme {
  const isDark = mode === 'dark';
  return {
    mode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    shadows: isDark ? darkShadows : lightShadows,
  };
}
