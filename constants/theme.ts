import { Platform } from 'react-native';

export const AxisColors = {
  background: '#0E0E10',
  surface: '#1A1815',
  border: '#2A2723',
  primary: '#D97706',
  textPrimary: '#FAFAF9',
  textSecondary: '#A8A29E',
  muted: '#44403C',
  success: '#65A30D',
  crisis: '#DC2626',
};

export const BotAccents = {
  hitch: '#F59E0B',
  mira: '#C8847A',
  zoe: '#B45309',
  rex: '#C2410C',
};

const dark = {
  text: AxisColors.textPrimary,
  background: AxisColors.background,
  tint: AxisColors.primary,
  icon: AxisColors.textSecondary,
  tabIconDefault: AxisColors.textSecondary,
  tabIconSelected: AxisColors.primary,
};

export const Colors = {
  light: dark,
  dark,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Fraunces',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter',
    serif: 'Fraunces',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    serif: "Fraunces, Georgia, serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, monospace",
  },
});
