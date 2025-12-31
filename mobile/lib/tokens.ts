export const colors = {
  flickBlue: '#4B6FFF',
  flickBlueLight: '#E8EDFF',
  flickYellow: '#FFD93D',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F8F8F8',
    200: '#E5E5E5',
    600: '#666666',
    700: '#4A4A4A',
    900: '#1a1a1a',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  largeTitle: {
    fontSize: 36,
    fontWeight: 'bold' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
} as const;

