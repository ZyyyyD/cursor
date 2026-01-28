export const colors = {
  // Primary palette (purple theme like the reference)
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGradient: ['#6366F1', '#4F46E5'],

  // Sidebar/Nav dark purple
  navBg: '#1E1B4B',
  navBgLight: '#312E81',

  // Accent colors for cards
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  teal: '#14B8A6',
  tealLight: '#F0FDFA',
  pink: '#EC4899',
  pinkLight: '#FDF2F8',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',
  green: '#22C55E',
  greenLight: '#F0FDF4',
  red: '#EF4444',
  redLight: '#FEF2F2',
  yellow: '#EAB308',
  yellowLight: '#FEFCE8',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',

  // Status
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#6366F1',
  infoLight: '#E0E7FF',

  // Neutrals
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Special
  overlay: 'rgba(30, 27, 75, 0.6)',
  cardGlow: 'rgba(99, 102, 241, 0.08)',

  // Chart colors
  chartPurple: '#8B5CF6',
  chartOrange: '#F97316',
  chartTeal: '#14B8A6',
  chartPink: '#EC4899',
  chartBlue: '#3B82F6',
  chartGreen: '#22C55E',
  chartYellow: '#EAB308',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionMedium: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  small: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  metric: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  metricSmall: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
};

export const shadow = {
  sm: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
