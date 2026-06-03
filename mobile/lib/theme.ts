// ── Color Palette ────────────────────────────────────────────────────────────
// Mobile uses GREEN palette (not the web's blue — intentional)

export const colors = {
  primary:        '#16A34A', // green-600 — tabs, buttons, pills
  primaryDark:    '#14532D', // green-900
  primaryLight:   '#BBF7D0', // green-200
  gradientStart:  '#052e16', // green-950 — hero gradient top
  gradientMid:    '#14532D', // green-900
  gradientEnd:    '#166534', // green-800
  accent:         '#F59E0B', // amber-500 — CTA buttons, stars
  accentDark:     '#B45309', // amber-700
  background:     '#F0FDF4', // green-50
  surface:        '#FFFFFF',
  surfaceAlt:     '#F8FAFC', // slate-50
  text:           '#0F172A', // slate-900
  textSecondary:  '#475569', // slate-600
  textMuted:      '#94A3B8', // slate-400
  border:         '#D1FAE5', // green-100
  borderMedium:   '#6EE7B7', // green-300
  error:          '#EF4444',
  errorLight:     '#FEE2E2',
  success:        '#16A34A',
  warning:        '#F59E0B',
  overlay:        'rgba(5, 46, 22, 0.7)',
  white:          '#FFFFFF',
  black:          '#000000',
};

// ── Spacing ───────────────────────────────────────────────────────────────────

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

// ── Border Radius ─────────────────────────────────────────────────────────────

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
};

// ── Typography ────────────────────────────────────────────────────────────────

export const fonts = {
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semiBold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

// ── Shadows ───────────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
