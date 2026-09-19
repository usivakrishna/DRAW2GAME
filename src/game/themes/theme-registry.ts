import type { GameTheme, ThemeId } from "@/game/themes/theme-types";

export const THEMES: Record<ThemeId, GameTheme> = {
  classic: {
    background: {
      accent: 0xcbe5ff,
      primary: 0x60a5fa, // Sky Blue
      secondary: 0x93c5fd,
      type: "gradient",
    },
    coin: {
      border: 0xd97706,
      fill: 0xfbbf24,
      shine: 0xfef3c7,
    },
    description: "Vibrant arcade visuals with bright skies and colorful classic geometry.",
    enemy: {
      border: 0x7c2d12,
      eyeColor: 0xffffff,
      fill: 0xef4444,
    },
    goal: {
      aura: 0x34d399,
      border: 0x065f46,
      fill: 0x10b981,
    },
    id: "classic",
    name: "Classic Arcade",
    particles: {
      alpha: 0.8,
      color: 0xfbbf24,
    },
    platform: {
      border: 0x166534,
      fill: 0x22c55e,
      surfaceFill: 0x4ade80,
    },
    player: {
      border: 0x1e3a8a,
      eyeColor: 0xffffff,
      fill: 0x3b82f6,
      glow: 0x93c5fd,
    },
    spike: {
      border: 0x374151,
      fill: 0x9ca3af,
    },
  },

  cyberpunk: {
    background: {
      accent: 0x2e1065,
      primary: 0x09090b, // Deep black with neon grid
      secondary: 0x18181b,
      type: "grid",
    },
    coin: {
      aura: 0x22d3ee,
      border: 0x0891b2,
      fill: 0x06b6d4,
      shine: 0xcffafe,
    },
    description: "Dark synthwave city aesthetic with luminous cyan and hot magenta neon highlights.",
    enemy: {
      aura: 0xf43f5e,
      border: 0xbe123c,
      eyeColor: 0xffe4e6,
      fill: 0xf43f5e,
    },
    goal: {
      aura: 0xa855f7,
      border: 0x7e22ce,
      fill: 0xc084fc,
    },
    id: "cyberpunk",
    name: "Cyberpunk",
    particles: {
      alpha: 0.9,
      color: 0x22d3ee,
    },
    platform: {
      border: 0xec4899,
      fill: 0x1f2937,
      surfaceFill: 0x06b6d4,
    },
    player: {
      aura: 0x38bdf8,
      border: 0x0284c7,
      eyeColor: 0x38bdf8,
      fill: 0x0ea5e9,
      glow: 0x38bdf8,
    },
    spike: {
      border: 0x9f1239,
      fill: 0xe11d48,
    },
  },

  dark: {
    background: {
      accent: 0x1e1b4b,
      primary: 0x0f172a, // Slate 900
      secondary: 0x1e293b,
      type: "gradient",
    },
    coin: {
      border: 0x94a3b8,
      fill: 0xe2e8f0,
      shine: 0xffffff,
    },
    description: "Moody, high-contrast shadowy atmosphere with spectral cyan and obsidian hues.",
    enemy: {
      border: 0x581c87,
      eyeColor: 0xf43f5e,
      fill: 0x7c3aed,
    },
    goal: {
      aura: 0x818cf8,
      border: 0x3730a3,
      fill: 0x6366f1,
    },
    id: "dark",
    name: "Dark Shadow",
    particles: {
      alpha: 0.6,
      color: 0x38bdf8,
    },
    platform: {
      border: 0x334155,
      fill: 0x1e293b,
      surfaceFill: 0x475569,
    },
    player: {
      border: 0x0e7490,
      eyeColor: 0xffffff,
      fill: 0x06b6d4,
      glow: 0x22d3ee,
    },
    spike: {
      border: 0x475569,
      fill: 0x64748b,
    },
  },

  forest: {
    background: {
      accent: 0x14532d,
      primary: 0x064e3b, // Deep forest green
      secondary: 0x022c22,
      type: "gradient",
    },
    coin: {
      border: 0xb45309,
      fill: 0xf59e0b,
      shine: 0xfef08a,
    },
    description: "Lush ancient woodland with earthy moss platforms and glowing firefly motes.",
    enemy: {
      border: 0x451a03,
      eyeColor: 0xfde047,
      fill: 0x9a3412,
    },
    goal: {
      aura: 0x86efac,
      border: 0x15803d,
      fill: 0x22c55e,
    },
    id: "forest",
    name: "Forest Realm",
    particles: {
      alpha: 0.7,
      color: 0xfacc15,
    },
    platform: {
      border: 0x3f2e18,
      fill: 0x5c4033,
      surfaceFill: 0x15803d,
    },
    player: {
      border: 0x047857,
      eyeColor: 0xffffff,
      fill: 0x10b981,
      glow: 0x6ee7b7,
    },
    spike: {
      border: 0x292524,
      fill: 0x78716c,
    },
  },

  samurai: {
    background: {
      accent: 0x831843,
      primary: 0x4c0519, // Deep sunset crimson
      secondary: 0x881337,
      type: "gradient",
    },
    coin: {
      border: 0x854d0e,
      fill: 0xeab308,
      shine: 0xfef9c3,
    },
    description: "Crimson twilight setting with golden mon coins and dark cedar architecture.",
    enemy: {
      border: 0x3f3f46,
      eyeColor: 0xfacc15,
      fill: 0x18181b,
    },
    goal: {
      aura: 0xfde047,
      border: 0x991b1b,
      fill: 0xd97706,
    },
    id: "samurai",
    name: "Samurai Sunset",
    particles: {
      alpha: 0.85,
      color: 0xfb7185,
    },
    platform: {
      border: 0x451a03,
      fill: 0x78350f,
      surfaceFill: 0x9a3412,
    },
    player: {
      border: 0x831843,
      eyeColor: 0xffffff,
      fill: 0xbe123c,
      glow: 0xf43f5e,
    },
    spike: {
      border: 0x27272a,
      fill: 0xa1a1aa,
    },
  },

  space: {
    background: {
      accent: 0x1e1b4b,
      primary: 0x030712, // Deep void with cosmic stars
      secondary: 0x0f172a,
      type: "stars",
    },
    coin: {
      aura: 0x38bdf8,
      border: 0x0284c7,
      fill: 0x38bdf8,
      shine: 0xe0f2fe,
    },
    description: "Infinite starry cosmos with celestial asteroids and glowing stargate portals.",
    enemy: {
      border: 0x881337,
      eyeColor: 0x38bdf8,
      fill: 0xe11d48,
    },
    goal: {
      aura: 0x38bdf8,
      border: 0x1d4ed8,
      fill: 0x60a5fa,
    },
    id: "space",
    name: "Cosmic Space",
    particles: {
      alpha: 0.9,
      color: 0x38bdf8,
    },
    platform: {
      border: 0x374151,
      fill: 0x1f2937,
      surfaceFill: 0x4b5563,
    },
    player: {
      border: 0x4338ca,
      eyeColor: 0xfbbf24,
      fill: 0x6366f1,
      glow: 0x818cf8,
    },
    spike: {
      border: 0x111827,
      fill: 0x475569,
    },
  },
};

export const THEME_LIST: GameTheme[] = Object.values(THEMES);
