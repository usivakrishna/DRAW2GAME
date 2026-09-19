export type ThemeId =
  | "classic"
  | "cyberpunk"
  | "dark"
  | "forest"
  | "samurai"
  | "space";

export type StyleId = "cartoon" | "clean" | "neon" | "retro";

export interface EntityColorPalette {
  aura?: number;
  border: number;
  eyeColor?: number;
  fill: number;
  glow?: number;
  shine?: number;
  surfaceFill?: number;
}

export interface GameTheme {
  background: {
    accent?: number;
    primary: number;
    secondary: number;
    type: "gradient" | "grid" | "solid" | "stars";
  };
  coin: EntityColorPalette;
  description: string;
  enemy: EntityColorPalette;
  goal: EntityColorPalette;
  id: ThemeId;
  name: string;
  particles: {
    alpha: number;
    color: number;
  };
  platform: EntityColorPalette;
  player: EntityColorPalette;
  spike: EntityColorPalette;
}

export interface GameStyle {
  borderWidth: number;
  cornerRadius: number;
  glowStrength: number;
  id: StyleId;
  name: string;
  pixelated: boolean;
}

export interface ResolvedThemeConfig {
  background: GameTheme["background"];
  coin: EntityColorPalette;
  enemy: EntityColorPalette;
  goal: EntityColorPalette;
  particles: GameTheme["particles"];
  platform: EntityColorPalette;
  player: EntityColorPalette;
  spike: EntityColorPalette;
  style: GameStyle;
  theme: GameTheme;
}
