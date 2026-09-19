import { STYLES } from "@/game/themes/style-registry";
import { THEMES } from "@/game/themes/theme-registry";
import type {
  ResolvedThemeConfig,
  StyleId,
  ThemeId,
} from "@/game/themes/theme-types";

export interface CustomThemeOverrides {
  backgroundPrimary?: number;
  borderWidth?: number;
  playerFill?: number;
}

/**
 * Resolves a complete rendering theme by combining:
 * Theme (colors & atmosphere) + Style (geometry & outlines) + Customization (overrides)
 */
export function resolveTheme(
  themeId: ThemeId = "classic",
  styleId: StyleId = "clean",
  overrides?: CustomThemeOverrides,
): ResolvedThemeConfig {
  const baseTheme = THEMES[themeId] ?? THEMES.classic;
  const baseStyle = STYLES[styleId] ?? STYLES.clean;

  const style = {
    ...baseStyle,
    borderWidth: overrides?.borderWidth ?? baseStyle.borderWidth,
  };

  const background = {
    ...baseTheme.background,
    primary: overrides?.backgroundPrimary ?? baseTheme.background.primary,
  };

  const player = {
    ...baseTheme.player,
    fill: overrides?.playerFill ?? baseTheme.player.fill,
  };

  return {
    background,
    coin: baseTheme.coin,
    enemy: baseTheme.enemy,
    goal: baseTheme.goal,
    particles: baseTheme.particles,
    platform: baseTheme.platform,
    player,
    spike: baseTheme.spike,
    style,
    theme: baseTheme,
  };
}
