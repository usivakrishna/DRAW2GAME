export type EditAction =
  | "ADD"
  | "REMOVE"
  | "SET"
  | "UPDATE"
  | "MOVE"
  | "RESIZE"
  | "CHANGE_THEME"
  | "CHANGE_STYLE"
  | "CHANGE_MODE";

export type EditTarget =
  | "coin"
  | "platform"
  | "enemy"
  | "spike"
  | "player"
  | "goal"
  | "gravity"
  | "jump"
  | "speed"
  | "theme"
  | "style"
  | "game_mode"
  | "world";

export interface GameEditCommand {
  action: EditAction;
  parameters: Record<string, unknown>;
  rawPrompt: string;
  target: EditTarget;
}

export interface CommandParseResult {
  command?: GameEditCommand | undefined;
  error?: string | undefined;
  success: boolean;
  suggestions?: string[] | undefined;
}

export interface EditExecutionResult {
  error?: string | undefined;
  message?: string | undefined;
  success: boolean;
  updatedLevel?: import("@/json/level-schema").LevelDefinition | undefined;
  updatedStyle?: import("@/game/themes/theme-types").StyleId | undefined;
  updatedTheme?: import("@/game/themes/theme-types").ThemeId | undefined;
}

export interface EditHistoryItem {
  action?: EditAction | undefined;
  id: string;
  previousLevel: import("@/json/level-schema").LevelDefinition;
  previousStyle?: import("@/game/themes/theme-types").StyleId | undefined;
  previousTheme?: import("@/game/themes/theme-types").ThemeId | undefined;
  prompt: string;
  summary: string;
  target?: EditTarget | undefined;
  timestamp: string;
}

export interface ExampleCommand {
  category: string;
  label: string;
  prompt: string;
}

export const EXAMPLE_COMMANDS: ExampleCommand[] = [
  { category: "Coins", label: "Add 5 Coins", prompt: "Add 5 coins" },
  { category: "Coins", label: "Remove Coins", prompt: "Remove all coins" },
  { category: "Hazards", label: "Remove Spikes", prompt: "Remove all spikes" },
  { category: "Hazards", label: "Add 2 Spikes", prompt: "Add 2 spikes" },
  { category: "Enemies", label: "Faster Enemies", prompt: "Make enemies faster" },
  { category: "Enemies", label: "Slower Enemies", prompt: "Make enemies slower" },
  { category: "Enemies", label: "Add Enemy", prompt: "Add an enemy" },
  { category: "Platforms", label: "Add Platforms", prompt: "Add more platforms" },
  { category: "Platforms", label: "Wider Platforms", prompt: "Make platforms wider" },
  { category: "Physics", label: "Higher Jump", prompt: "Make the player jump higher" },
  { category: "Physics", label: "Lower Gravity", prompt: "Make gravity lower" },
  { category: "Physics", label: "Moon Gravity", prompt: "Set gravity to 600" },
  { category: "Theme", label: "Cyberpunk Theme", prompt: "Change theme to Cyberpunk" },
  { category: "Theme", label: "Samurai Theme", prompt: "Change theme to Samurai" },
  { category: "Style", label: "Neon Glow Style", prompt: "Change style to Neon Glow" },
  { category: "Style", label: "Retro Pixel Style", prompt: "Make it retro" },
  { category: "Level", label: "Side-Scrolling", prompt: "Change game to side-scrolling" },
  { category: "Level", label: "Single-Screen", prompt: "Change game to single-screen" },
  { category: "Level", label: "Wider World", prompt: "Make the level wider" },
];
