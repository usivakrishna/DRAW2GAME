import type { GameRuntimeSettings } from "@/types/game";

export const DEFAULT_GAME_RUNTIME_SETTINGS: GameRuntimeSettings = {
  gravityY: 1400,
  jumpVelocity: -520,
};

export const DEFAULT_GAME_VIEWPORT = {
  height: 720,
  width: 1280,
} as const;
