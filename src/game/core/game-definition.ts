/**
 * Universal 2D Game Architecture - Core Game Definition
 *
 * Provides the generic abstractions for any 2D game in DRAW2GAME,
 * decoupling game identity, rules, viewport, assets, and settings
 * from genre-specific implementations.
 */

export const SUPPORTED_GAME_TYPES = ["platformer"] as const;
export type SupportedGameType = (typeof SUPPORTED_GAME_TYPES)[number];

export const EXTENSION_GAME_TYPES = [
  "chess",
  "ludo",
  "pool",
  "carrom",
  "racing",
  "puzzle",
  "shooter",
  "sports",
] as const;
export type ExtensionGameType = (typeof EXTENSION_GAME_TYPES)[number];

export type GameType = SupportedGameType | ExtensionGameType;

export function isSupportedGameType(type: string): type is SupportedGameType {
  return (SUPPORTED_GAME_TYPES as readonly string[]).includes(type);
}

export function isKnownGameType(type: string): type is GameType {
  return (
    isSupportedGameType(type) ||
    (EXTENSION_GAME_TYPES as readonly string[]).includes(type)
  );
}

export interface GameViewport {
  height: number;
  width: number;
}

export interface GameMetadata {
  author?: string | undefined;
  createdAt?: string | undefined;
  description?: string | undefined;
  generatedAt?: string | undefined;
  source?: ("drawing" | "upload" | "detection" | "manual" | "ai-edit") | undefined;
  tags?: string[] | undefined;
  updatedAt?: string | undefined;
}

export interface GameObject {
  height?: number | undefined;
  id: string;
  name?: string | undefined;
  properties?: Record<string, unknown> | undefined;
  radius?: number | undefined;
  type: string;
  width?: number | undefined;
  x: number;
  y: number;
}

export interface GameRule {
  action?: string | undefined;
  condition?: string | undefined;
  description?: string | undefined;
  event?: string | undefined;
  id: string;
  name: string;
  parameters?: Record<string, unknown> | undefined;
}

export interface GameAsset {
  id: string;
  key: string;
  type: "image" | "spritesheet" | "audio" | "font" | "json";
  url?: string | undefined;
}

export interface GameSettings {
  audioEnabled?: boolean | undefined;
  customSettings?: Record<string, unknown> | undefined;
  debugPhysics?: boolean | undefined;
  styleId?: string | undefined;
  themeId?: string | undefined;
}

export interface EngineConfig {
  backgroundColor?: string | undefined;
  engineId: string;
  fps?: number | undefined;
  options?: Record<string, unknown> | undefined;
  renderer?: ("auto" | "canvas" | "webgl") | undefined;
}

/**
 * Universal GameDefinition container
 */
export interface GenericGameDefinition<
  TType extends GameType = GameType,
  TPayload = unknown,
> {
  assets: GameAsset[];
  engineConfig: EngineConfig;
  gameType: TType;
  id: string;
  metadata?: GameMetadata | undefined;
  name: string;
  objects: GameObject[];
  rules: GameRule[];
  settings: GameSettings;
  typePayload?: TPayload | undefined;
  version: number;
  viewport: GameViewport;
}

export type GameDefinition = GenericGameDefinition;
