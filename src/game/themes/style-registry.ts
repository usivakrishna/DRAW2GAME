import type { GameStyle, StyleId } from "@/game/themes/theme-types";

export const STYLES: Record<StyleId, GameStyle> = {
  cartoon: {
    borderWidth: 3,
    cornerRadius: 8,
    glowStrength: 0.2,
    id: "cartoon",
    name: "Cartoon",
    pixelated: false,
  },
  clean: {
    borderWidth: 1.5,
    cornerRadius: 4,
    glowStrength: 0,
    id: "clean",
    name: "Clean & Minimal",
    pixelated: false,
  },
  neon: {
    borderWidth: 2,
    cornerRadius: 6,
    glowStrength: 0.85,
    id: "neon",
    name: "Neon Glow",
    pixelated: false,
  },
  retro: {
    borderWidth: 3,
    cornerRadius: 0,
    glowStrength: 0,
    id: "retro",
    name: "Retro Arcade",
    pixelated: true,
  },
};

export const STYLE_LIST: GameStyle[] = Object.values(STYLES);
