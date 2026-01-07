// ============================================
// FLICK DESIGN SYSTEM v2.0
// Brand: Your friendly insight companion
// Personality: Warm, Supportive, Insightful, Playful
// ============================================

export const colors = {
  // ===== PRIMARY BRAND COLORS =====
  // Flick Teal - Main brand (warm, friendly, trustworthy)
  flickTeal: '#06B6D4',        // Primary action color
  flickTealDark: '#0891B2',    // Pressed states
  flickTealLight: '#CFFAFE',   // Backgrounds
  flickTealSoft: '#ECFEFF',    // Ultra light backgrounds
  
  // Flick Gold - Rewards & achievements (warm, valuable, exciting)
  flickGold: '#FBBF24',        // Coin color, rewards
  flickGoldDark: '#F59E0B',    // Pressed states
  flickGoldLight: '#FEF3C7',   // Backgrounds
  flickGoldShimmer: '#FDE68A', // Highlights
  
  // Flick Purple - Levels & progress (premium, achievement, growth)
  flickPurple: '#A855F7',      // Level badges
  flickPurpleDark: '#9333EA',  // Pressed states
  flickPurpleLight: '#F3E8FF', // Backgrounds
  flickPurpleSoft: '#FAF5FF',  // Ultra light backgrounds
  
  // ===== SEMANTIC COLORS =====
  // Success - Achievements, completed goals
  success: '#10B981',
  successLight: '#D1FAE5',
  successSoft: '#ECFDF5',
  
  // Warning - Important info, needs attention
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningSoft: '#FFFBEB',
  
  // Error - Mistakes, failed states
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorSoft: '#FEF2F2',
  
  // Info - Tips, insights, Flick's voice
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoSoft: '#EFF6FF',
  
  // ===== NEUTRAL PALETTE =====
  // Optimized for readability and emotional warmth
  white: '#FFFFFF',
  black: '#000000',
  
  // Warm grays (slight warmth for friendliness)
  gray: {
    50: '#FAFAF9',   // Backgrounds
    100: '#F5F5F4',  // Soft backgrounds
    200: '#E7E5E4',  // Borders, dividers
    300: '#D6D3D1',  // Disabled states
    400: '#A8A29E',  // Placeholder text
    500: '#78716C',  // Secondary text
    600: '#57534E',  // Body text
    700: '#44403C',  // Headings
    800: '#292524',  // Strong headings
    900: '#1C1917',  // Primary text
  },
  
  // Background system
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAF9',
    tertiary: '#F5F5F4',
    elevated: '#FFFFFF',
  },
  
  // Text system
  text: {
    primary: '#1C1917',    // Main content
    secondary: '#57534E',  // Supporting text
    tertiary: '#78716C',   // Subtle text
    inverse: '#FFFFFF',    // On dark backgrounds
    brand: '#0891B2',      // Brand emphasis
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const typography = {
  // Display - Hero moments
  display: {
    fontSize: 40,
    fontWeight: '900' as const,
    lineHeight: 44,
    letterSpacing: -1,
  },
  
  // Large Title - Screen titles
  largeTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  
  // Title - Section headers
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  
  // Headline - Card titles, important text
  headline: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  
  // Body Large - Emphasized body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
  
  // Body - Standard reading text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  
  // Body Small - Compact body text
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  
  // Caption - Labels, secondary info
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  
  // Label - Form labels, badges
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export const shadows = {
  // Subtle - Floating cards
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  // Elevated - Interactive elements
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  
  // Prominent - Cards, modals
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Dramatic - Overlays, important moments
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  
  // Branded shadows for special elements
  brand: {
    teal: {
      shadowColor: colors.flickTeal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    gold: {
      shadowColor: colors.flickGold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    purple: {
      shadowColor: colors.flickPurple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

// Animation timing (matches iOS/Material Design)
export const animation = {
  fast: 200,
  normal: 300,
  slow: 400,
  verySlow: 600,
} as const;

// Touch targets (WCAG AAA compliant)
export const touchTarget = {
  min: 44,        // Minimum touch target
  comfortable: 48, // Comfortable touch target
  large: 56,      // Large touch target
} as const;
