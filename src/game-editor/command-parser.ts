import type { CommandParseResult, GameEditCommand } from "./types";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  eight: 8,
  five: 5,
  four: 4,
  nine: 9,
  one: 1,
  seven: 7,
  six: 6,
  ten: 10,
  three: 3,
  two: 2,
};

function parseNumberToken(token?: string | undefined, defaultVal = 1): number {
  if (!token) return defaultVal;
  const lower = token.toLowerCase().trim();
  if (lower in WORD_NUMBERS) {
    return WORD_NUMBERS[lower] ?? defaultVal;
  }
  const parsed = Number.parseInt(lower, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultVal;
}

function normalizeTheme(raw: string): ThemeId | null {
  const t = raw.toLowerCase().trim();
  if (t.includes("cyber")) return "cyberpunk";
  if (t.includes("samurai") || t.includes("ninja")) return "samurai";
  if (t.includes("forest") || t.includes("jungle") || t.includes("wood")) return "forest";
  if (t.includes("space") || t.includes("galaxy") || t.includes("cosmic") || t.includes("star"))
    return "space";
  if (t.includes("shadow") || t.includes("dark") || t.includes("night")) return "dark";
  if (t.includes("classic") || t.includes("arcade") || t.includes("mario")) return "classic";
  return null;
}

function normalizeStyle(raw: string): StyleId | null {
  const s = raw.toLowerCase().trim();
  if (s.includes("neon") || s.includes("glow")) return "neon";
  if (s.includes("retro") || s.includes("pixel") || s.includes("8-bit")) return "retro";
  if (s.includes("cartoon") || s.includes("playful") || s.includes("bouncy")) return "cartoon";
  if (s.includes("clean") || s.includes("minimal")) return "clean";
  return null;
}

const DEFAULT_SUGGESTIONS = [
  "Add 5 coins",
  "Remove all spikes",
  "Make enemies faster",
  "Make the player jump higher",
  "Make gravity lower",
  "Change theme to Cyberpunk",
  "Change style to Neon Glow",
  "Change game to side-scrolling",
];

/**
 * Deterministic, rule-based natural language parser that translates user prompts
 * into validated, strongly-typed GameEditCommand objects.
 */
export function parseEditCommand(prompt: string): CommandParseResult {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      error: "Please enter a command to edit the game.",
      success: false,
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 4),
    };
  }

  const p = trimmed.toLowerCase();

  // 1. COINS
  // 1a. Remove all coins
  if (/(?:remove|delete|clear|destroy)\s+(?:all\s+)?coins?/i.test(p)) {
    return successCommand("REMOVE", "coin", { all: true }, trimmed);
  }

  // 1b. Remove specific number of coins
  const removeCoinMatch = p.match(/(?:remove|delete)\s+(\d+|one|two|three|four|five)\s+coins?/i);
  if (removeCoinMatch) {
    const count = parseNumberToken(removeCoinMatch[1], 1);
    return successCommand("REMOVE", "coin", { count }, trimmed);
  }

  // 1c. Add coins
  const addCoinMatch = p.match(
    /(?:add|create|spawn|place|drop)\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)?\s*coins?/i,
  );
  if (addCoinMatch) {
    const count = parseNumberToken(addCoinMatch[1], 1);
    return successCommand("ADD", "coin", { count }, trimmed);
  }

  // 2. SPIKES / HAZARDS
  // 2a. Remove spikes
  if (
    /(?:remove|delete|clear|no|eliminate)\s+(?:all\s+)?spikes?/i.test(p) ||
    /spikes?\s+(?:are\s+)?(?:gone|removed)/i.test(p)
  ) {
    return successCommand("REMOVE", "spike", { all: true }, trimmed);
  }

  // 2b. Add spikes
  const addSpikeMatch = p.match(
    /(?:add|create|spawn|place)\s+(\d+|a|an|one|two|three|four|five)?\s*spikes?/i,
  );
  if (addSpikeMatch) {
    const count = parseNumberToken(addSpikeMatch[1], 1);
    return successCommand("ADD", "spike", { count }, trimmed);
  }

  // 3. PLATFORMS
  // 3a. Add platforms
  const addPlatformMatch = p.match(
    /(?:add|create|spawn|place)\s+(?:more\s+)?(\d+|a|an|one|two|three|four|five)?\s*platforms?/i,
  );
  if (addPlatformMatch) {
    const count = parseNumberToken(addPlatformMatch[1], 1);
    return successCommand("ADD", "platform", { count }, trimmed);
  }

  // 3b. Remove platforms
  if (/(?:remove|delete)\s+(?:the\s+)?last\s+platform/i.test(p)) {
    return successCommand("REMOVE", "platform", { count: 1, position: "last" }, trimmed);
  }
  const removePlatformMatch = p.match(/(?:remove|delete)\s+(\d+|one|two|three)\s+platforms?/i);
  if (removePlatformMatch) {
    const count = parseNumberToken(removePlatformMatch[1], 1);
    return successCommand("REMOVE", "platform", { count }, trimmed);
  }

  // 3c. Resize platforms
  if (
    /(?:make|set)\s+platforms?\s+(wider|longer|larger|bigger)/i.test(p) ||
    /(?:increase|expand)\s+platform\s+width/i.test(p)
  ) {
    return successCommand("RESIZE", "platform", { widthMultiplier: 1.4 }, trimmed);
  }
  if (
    /(?:make|set)\s+platforms?\s+(narrower|shorter|smaller)/i.test(p) ||
    /(?:decrease|shrink)\s+platform\s+width/i.test(p)
  ) {
    return successCommand("RESIZE", "platform", { widthMultiplier: 0.75 }, trimmed);
  }

  // 4. ENEMIES
  // 4a. Enemy speed
  if (
    /(?:make\s+(?:the\s+)?enemies\s+(faster|quicker|speedier)|speed\s+up\s+enemies|(?:increase|boost)\s+enemy\s+speed)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "enemy", { speedMultiplier: 1.6 }, trimmed);
  }
  if (
    /(?:make\s+(?:the\s+)?enemies\s+(slower|slow)|slow\s+down\s+enemies|(?:decrease|reduce)\s+enemy\s+speed)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "enemy", { speedMultiplier: 0.6 }, trimmed);
  }
  const setEnemySpeedMatch = p.match(/set\s+enemy\s+speed\s+to\s+(\d+(?:\.\d+)?)/i);
  if (setEnemySpeedMatch && setEnemySpeedMatch[1]) {
    const val = Number.parseFloat(setEnemySpeedMatch[1]);
    return successCommand("SET", "enemy", { speed: val }, trimmed);
  }

  // 4b. Remove enemies
  if (/(?:remove|delete|clear|no|eliminate)\s+(?:all\s+)?enem(?:y|ies)/i.test(p)) {
    return successCommand("REMOVE", "enemy", { all: true }, trimmed);
  }

  // 4c. Add enemies
  const addEnemyMatch = p.match(
    /(?:add|create|spawn|place)\s+(\d+|a|an|one|two|three)?\s*enem(?:y|ies)/i,
  );
  if (addEnemyMatch) {
    const count = parseNumberToken(addEnemyMatch[1], 1);
    return successCommand("ADD", "enemy", { count }, trimmed);
  }

  // 5. PLAYER & PHYSICS
  // 5a. Jump height / velocity
  if (
    /(?:make\s+(?:the\s+)?player\s+jump\s+higher|higher\s+jump|(?:increase|boost)\s+jump(?:\s+height|\s+velocity)?)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "jump", { multiplier: 1.25 }, trimmed);
  }
  if (
    /(?:make\s+(?:the\s+)?player\s+jump\s+lower|lower\s+jump|(?:decrease|reduce)\s+jump(?:\s+height|\s+velocity)?)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "jump", { multiplier: 0.8 }, trimmed);
  }
  const setJumpMatch = p.match(/set\s+jump(?:\s+velocity|\s+height)?\s+to\s+(-?\d+)/i);
  if (setJumpMatch && setJumpMatch[1]) {
    const val = Number.parseInt(setJumpMatch[1], 10);
    return successCommand("SET", "jump", { value: val }, trimmed);
  }

  // 5b. Gravity
  if (
    /(?:make\s+gravity\s+(lower|weaker|lighter)|low\s+gravity|moon\s+gravity|(?:decrease|reduce|lower)\s+gravity)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "gravity", { multiplier: 0.7 }, trimmed);
  }
  if (
    /(?:make\s+gravity\s+(higher|stronger|heavier)|high\s+gravity|heavy\s+gravity|(?:increase|boost)\s+gravity)/i.test(
      p,
    )
  ) {
    return successCommand("UPDATE", "gravity", { multiplier: 1.35 }, trimmed);
  }
  const setGravityMatch = p.match(/set\s+gravity\s+to\s+(\d+)/i);
  if (setGravityMatch && setGravityMatch[1]) {
    const val = Number.parseInt(setGravityMatch[1], 10);
    return successCommand("SET", "gravity", { value: val }, trimmed);
  }

  // 5c. Move player
  const movePlayerMatch = p.match(/move\s+player\s+to\s+(\d+)[,\s]+(\d+)/i);
  if (movePlayerMatch && movePlayerMatch[1] && movePlayerMatch[2]) {
    const x = Number.parseInt(movePlayerMatch[1], 10);
    const y = Number.parseInt(movePlayerMatch[2], 10);
    return successCommand("MOVE", "player", { x, y }, trimmed);
  }
  const movePlayerDirMatch = p.match(/move\s+player\s+(left|right|up|down)(?:\s+by)?\s+(\d+)/i);
  if (movePlayerDirMatch && movePlayerDirMatch[1] && movePlayerDirMatch[2]) {
    const direction = movePlayerDirMatch[1].toLowerCase();
    const offset = Number.parseInt(movePlayerDirMatch[2], 10);
    return successCommand("MOVE", "player", { direction, offset }, trimmed);
  }

  // 5d. Player removal protection
  if (/(?:remove|delete|kill)\s+(?:the\s+)?player/i.test(p)) {
    return {
      error: "Cannot remove the player. Every platformer level requires a player spawn point.",
      success: false,
      suggestions: ["Move player to 100, 400", "Make the player jump higher"],
    };
  }

  // 6. GOAL
  const moveGoalMatch = p.match(/move\s+goal\s+to\s+(\d+)[,\s]+(\d+)/i);
  if (moveGoalMatch && moveGoalMatch[1] && moveGoalMatch[2]) {
    const x = Number.parseInt(moveGoalMatch[1], 10);
    const y = Number.parseInt(moveGoalMatch[2], 10);
    return successCommand("MOVE", "goal", { x, y }, trimmed);
  }
  const moveGoalDirMatch = p.match(/move\s+goal\s+(left|right|up|down)(?:\s+by)?\s+(\d+)/i);
  if (moveGoalDirMatch && moveGoalDirMatch[1] && moveGoalDirMatch[2]) {
    const direction = moveGoalDirMatch[1].toLowerCase();
    const offset = Number.parseInt(moveGoalDirMatch[2], 10);
    return successCommand("MOVE", "goal", { direction, offset }, trimmed);
  }
  if (/(?:remove|delete)\s+(?:the\s+)?goal/i.test(p)) {
    return {
      error: "Cannot remove the goal flag. Every level needs a goal condition to be beatable.",
      success: false,
      suggestions: ["Move goal to 1200, 450", "Move goal right by 200"],
    };
  }

  // 7. THEMES
  const themeChangeMatch = p.match(
    /(?:change|set|switch)\s+theme\s+to\s+(.+)|(?:use|apply)\s+(.+)\s+theme/i,
  );
  if (themeChangeMatch) {
    const rawTarget = themeChangeMatch[1] ?? themeChangeMatch[2] ?? "";
    const themeId = normalizeTheme(rawTarget);
    if (themeId) {
      return successCommand("CHANGE_THEME", "theme", { themeId }, trimmed);
    }
    return {
      error: `Unknown theme "${rawTarget}". Supported themes: Classic Arcade, Dark Shadow, Samurai, Forest, Cyberpunk City, Space Odyssey.`,
      success: false,
      suggestions: [
        "Change theme to Cyberpunk",
        "Change theme to Samurai",
        "Change theme to Forest",
      ],
    };
  }
  // Direct theme mention e.g. "cyberpunk theme" or "samurai theme"
  const directTheme = normalizeTheme(p);
  if (directTheme && p.includes("theme")) {
    return successCommand("CHANGE_THEME", "theme", { themeId: directTheme }, trimmed);
  }

  // 8. STYLES
  const styleChangeMatch = p.match(
    /(?:change|set|switch)\s+style\s+to\s+(.+)|(?:use|apply)\s+(.+)\s+style|(?:make\s+it|set)\s+(retro|neon|cartoon|clean)/i,
  );
  if (styleChangeMatch) {
    const rawTarget = styleChangeMatch[1] ?? styleChangeMatch[2] ?? styleChangeMatch[3] ?? "";
    const styleId = normalizeStyle(rawTarget);
    if (styleId) {
      return successCommand("CHANGE_STYLE", "style", { styleId }, trimmed);
    }
    return {
      error: `Unknown visual style "${rawTarget}". Supported styles: Clean & Minimal, Retro Pixel, Neon Glow, Cartoon Playful.`,
      success: false,
      suggestions: [
        "Change style to Neon Glow",
        "Make it retro",
        "Change style to Cartoon",
      ],
    };
  }
  const directStyle = normalizeStyle(p);
  if (directStyle && (p.includes("style") || p.includes("glow") || p.includes("pixel"))) {
    return successCommand("CHANGE_STYLE", "style", { styleId: directStyle }, trimmed);
  }

  // 9. GAME MODE & WORLD
  if (
    /(?:change|switch|set|make)\s+(?:the\s+)?game\s+(?:to\s+)?(?:side-scrolling|scrolling|sidescrolling)/i.test(
      p,
    ) ||
    /side-scrolling\s+mode/i.test(p)
  ) {
    return successCommand("CHANGE_MODE", "game_mode", { mode: "side-scrolling" }, trimmed);
  }
  if (
    /(?:change|switch|set|make)\s+(?:the\s+)?game\s+(?:to\s+)?(?:single-screen|singlescreen|static)/i.test(
      p,
    ) ||
    /single-screen\s+mode/i.test(p)
  ) {
    return successCommand("CHANGE_MODE", "game_mode", { mode: "single-screen" }, trimmed);
  }

  // 9b. World Width
  if (
    /(?:make|set)\s+(?:the\s+)?(?:level|world|map)\s+(wider|longer|larger|bigger)/i.test(p) ||
    /(?:increase|expand)\s+(?:world|level)\s+width/i.test(p)
  ) {
    return successCommand("RESIZE", "world", { widthMultiplier: 1.5 }, trimmed);
  }
  if (
    /(?:make|set)\s+(?:the\s+)?(?:level|world|map)\s+(narrower|shorter|smaller)/i.test(p) ||
    /(?:decrease|shrink)\s+(?:world|level)\s+width/i.test(p)
  ) {
    return successCommand("RESIZE", "world", { widthMultiplier: 0.75 }, trimmed);
  }
  const setWorldWidthMatch = p.match(/set\s+(?:world|level)\s+width\s+to\s+(\d+)/i);
  if (setWorldWidthMatch && setWorldWidthMatch[1]) {
    const width = Number.parseInt(setWorldWidthMatch[1], 10);
    return successCommand("SET", "world", { width }, trimmed);
  }

  // Unrecognized command fallback with helpful guidance
  return {
    error: `I couldn't understand that command ("${trimmed}"). Try one of the suggestions below.`,
    success: false,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

function successCommand(
  action: GameEditCommand["action"],
  target: GameEditCommand["target"],
  parameters: Record<string, unknown>,
  rawPrompt: string,
): CommandParseResult {
  return {
    command: {
      action,
      parameters,
      rawPrompt,
      target,
    },
    success: true,
  };
}
