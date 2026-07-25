import { useTheme } from '@/contexts/ThemeContext';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The resolved scheme is determined by the user's theme preference
 * (System / Light / Dark) stored via ThemeContext. When the preference
 * is "System" it falls back to the device appearance setting.
 */
export function useColors() {
  const { resolvedScheme } = useTheme();
  const palette =
    resolvedScheme === 'dark' && 'dark' in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
