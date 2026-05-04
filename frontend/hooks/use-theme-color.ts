/*
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorName = keyof typeof theme.colors;
type TextColorName = keyof typeof theme.colors.text;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName
) {
  const colorScheme = useColorScheme() ?? 'light';
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Handle nested text colors
  if (colorName === 'text') {
    return theme.colors.text.primary;
  }

  return theme.colors[colorName];
}

export function useTextColor(
  textColorName: TextColorName = 'primary'
): string {
  return theme.colors.text[textColorName];
}

// Helper to get any theme value
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    ...theme,
    // You can add dark/light variants here later
    colors: theme.colors,
  };
}

// Direct access without hook (for stylesheets)
export const getTheme = () => theme;
export const getColors = () => theme.colors;
export const getTextColors = () => theme.colors.text;