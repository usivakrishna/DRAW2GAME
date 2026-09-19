import { describe, expect, it } from "vitest";
import { resolveTheme } from "@/game/themes/theme-resolver";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

describe("theme-resolver", () => {
  const allThemes: ThemeId[] = [
    "classic",
    "dark",
    "samurai",
    "forest",
    "cyberpunk",
    "space",
  ];

  const allStyles: StyleId[] = ["clean", "retro", "neon", "cartoon"];

  it.each(allThemes)("resolves theme %s with complete color palette", (themeId) => {
    const resolved = resolveTheme(themeId, "clean");

    expect(resolved.theme.id).toBe(themeId);
    expect(resolved.background.primary).toBeTypeOf("number");
    expect(resolved.player.fill).toBeTypeOf("number");
    expect(resolved.platform.fill).toBeTypeOf("number");
    expect(resolved.coin.fill).toBeTypeOf("number");
    expect(resolved.enemy.fill).toBeTypeOf("number");
    expect(resolved.spike.fill).toBeTypeOf("number");
    expect(resolved.goal.fill).toBeTypeOf("number");
  });

  it.each(allStyles)("resolves style %s with valid geometry properties", (styleId) => {
    const resolved = resolveTheme("classic", styleId);

    expect(resolved.style.id).toBe(styleId);
    expect(resolved.style.borderWidth).toBeGreaterThan(0);
    expect(resolved.style.cornerRadius).toBeGreaterThanOrEqual(0);
    expect(resolved.style.glowStrength).toBeGreaterThanOrEqual(0);
  });

  it("applies customization overrides", () => {
    const resolved = resolveTheme("classic", "clean", {
      backgroundPrimary: 0x112233,
      borderWidth: 5,
      playerFill: 0xff00ff,
    });

    expect(resolved.background.primary).toBe(0x112233);
    expect(resolved.style.borderWidth).toBe(5);
    expect(resolved.player.fill).toBe(0xff00ff);
  });

  it("falls back gracefully when given invalid IDs", () => {
    const resolved = resolveTheme(
      "unknown" as unknown as ThemeId,
      "unknown" as unknown as StyleId,
    );

    expect(resolved.theme.id).toBe("classic");
    expect(resolved.style.id).toBe("clean");
  });
});
