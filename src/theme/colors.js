export const COLORS = {
  // Brand Colors
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8', // Indigo 400
  primaryDark: '#3730A3', // Indigo 800

  secondary: '#10B981', // Emerald 500
  secondaryLight: '#34D399', // Emerald 400
  secondaryDark: '#059669', // Emerald 600

  accent: '#F59E0B', // Amber 500

  // Neutral Colors (Slate based for premium feel)
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceHighlight: '#F1F5F9', // Slate 100

  card: '#FFFFFF',
  inputBackground: '#F8FAFC',
  modalBackground: '#FFFFFF',

  text: '#0F172A', // Slate 900 (High contrast)
  textMedium: '#334155', // Slate 700
  textLight: '#64748B', // Slate 500
  textPlaceholder: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  border: '#E2E8F0', // Slate 200
  borderDark: '#CBD5E1', // Slate 300

  // Semantic
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Gradients
  gradients: {
    primary: ['#4F46E5', '#4338CA'], // Indigo 600 -> Indigo 700
    primaryLight: ['#6366F1', '#4F46E5'], // Indigo 500 -> Indigo 600
    secondary: ['#10B981', '#059669'], // Emerald 500 -> Emerald 600
    surface: ['#FFFFFF', '#F8FAFC'], // White -> Slate 50
    dark: ['#1E293B', '#0F172A'], // Slate 800 -> Slate 900
    blue: ['#3B82F6', '#2563EB'], // Blue 500 -> Blue 600
    glass: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
    glassDark: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'],
  },

  // State
  status: {
    active: '#10B981',
    inactive: '#94A3B8',
    pending: '#F59E0B',
  },

  checked: {
    true: '#4F46E5',
    false: '#CBD5E1',
  },
};
