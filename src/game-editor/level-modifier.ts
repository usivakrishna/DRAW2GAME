import type { EditExecutionResult, GameEditCommand } from "./types";
import {
  type CoinEntity,
  type EnemyEntity,
  type GameMode,
  type LevelDefinition,
  levelSchema,
  type PlatformEntity,
  type SpikeEntity,
} from "@/json/level-schema";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

function createUniqueId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safely and immutably modifies a canonical Phase 5 LevelDefinition based on a
 * structured GameEditCommand, enforcing physical invariants and schema validation.
 */
export function applyEditCommand(
  currentLevel: LevelDefinition,
  command: GameEditCommand,
  currentTheme?: ThemeId | undefined,
  currentStyle?: StyleId | undefined,
): EditExecutionResult {
  const worldW = currentLevel.world?.width ?? currentLevel.viewport?.width ?? 1280;
  const worldH = currentLevel.world?.height ?? currentLevel.viewport?.height ?? 720;

  let nextLevel: LevelDefinition = JSON.parse(JSON.stringify(currentLevel)) as LevelDefinition;
  let nextTheme: ThemeId | undefined = currentTheme;
  let nextStyle: StyleId | undefined = currentStyle;
  let summaryMessage = "";

  const { action, parameters, target } = command;

  switch (target) {
    case "coin": {
      if (action === "REMOVE") {
        if (parameters.all) {
          const removedCount = nextLevel.coins.length;
          nextLevel.coins = [];
          summaryMessage = `Removed all ${removedCount} coins from the level.`;
        } else {
          const countToRemove = Math.min(
            (parameters.count as number) || 1,
            nextLevel.coins.length,
          );
          nextLevel.coins = nextLevel.coins.slice(0, -countToRemove);
          summaryMessage = `Removed ${countToRemove} coin(s). ${nextLevel.coins.length} remaining.`;
        }
      } else if (action === "ADD") {
        const countToAdd = clamp((parameters.count as number) || 1, 1, 20);
        const newCoins: CoinEntity[] = [];

        // Distribute added coins across platforms or jump arcs
        const platforms = nextLevel.platforms;
        for (let i = 0; i < countToAdd; i++) {
          let cx = 200 + i * 140;
          let cy = 400;

          if (platforms.length > 0) {
            const plat = platforms[i % platforms.length];
            if (plat) {
              const offsetAlongPlat = ((i % 3) + 1) * Math.min(50, plat.width / 4);
              cx = plat.x + offsetAlongPlat;
              cy = Math.max(80, plat.y - 60 - ((i % 2) * 30));
            }
          } else {
            cx = 150 + i * 160;
            cy = 380;
          }

          newCoins.push({
            id: createUniqueId("coin"),
            radius: 14,
            x: clamp(Math.round(cx), 40, worldW - 40),
            y: clamp(Math.round(cy), 40, worldH - 40),
          });
        }

        nextLevel.coins = [...nextLevel.coins, ...newCoins];
        summaryMessage = `Added ${countToAdd} coin(s). Total: ${nextLevel.coins.length} coins.`;
      }
      break;
    }

    case "spike": {
      if (action === "REMOVE") {
        const removedCount = nextLevel.spikes.length;
        nextLevel.spikes = [];
        summaryMessage = `Removed all ${removedCount} spike hazards from the stage.`;
      } else if (action === "ADD") {
        const countToAdd = clamp((parameters.count as number) || 1, 1, 10);
        const newSpikes: SpikeEntity[] = [];

        for (let i = 0; i < countToAdd; i++) {
          let sx = 380 + i * 70;
          let sy = 540;

          // Place near platform gaps
          if (nextLevel.platforms.length > 1) {
            const p1 = nextLevel.platforms[0];
            const p2 = nextLevel.platforms[1];
            if (p1 && p2) {
              const gapX = p1.x + p1.width + 10 + i * 50;
              sx = gapX;
              sy = Math.max(p1.y, p2.y) + 10;
            }
          }

          newSpikes.push({
            direction: "up",
            height: 20,
            id: createUniqueId("spike"),
            width: 44,
            x: clamp(Math.round(sx), 40, worldW - 80),
            y: clamp(Math.round(sy), 60, worldH - 40),
          });
        }

        nextLevel.spikes = [...nextLevel.spikes, ...newSpikes];
        summaryMessage = `Added ${countToAdd} spike hazard(s). Total: ${nextLevel.spikes.length}.`;
      }
      break;
    }

    case "platform": {
      if (action === "ADD") {
        const countToAdd = clamp((parameters.count as number) || 1, 1, 6);
        const newPlatforms: PlatformEntity[] = [];

        const lastPlat = nextLevel.platforms[nextLevel.platforms.length - 1];
        let baseX = lastPlat ? lastPlat.x + lastPlat.width + 80 : 300;
        let baseY = lastPlat ? lastPlat.y - 20 : 440;

        for (let i = 0; i < countToAdd; i++) {
          const platW = 200;
          const platH = 32;

          if (baseX + platW > worldW - 100) {
            // Wrap or stack backwards if exceeding world bounds
            baseX = Math.max(80, worldW - 400 - (i * 220));
            baseY = Math.max(160, baseY - 70);
          }

          newPlatforms.push({
            height: platH,
            id: createUniqueId("plat"),
            oneWay: false,
            width: platW,
            x: clamp(Math.round(baseX), 40, worldW - platW - 20),
            y: clamp(Math.round(baseY), 100, worldH - 100),
          });

          baseX += platW + 80;
          baseY = clamp(baseY + ((i % 2 === 0 ? -40 : 40)), 160, 560);
        }

        nextLevel.platforms = [...nextLevel.platforms, ...newPlatforms];
        summaryMessage = `Added ${countToAdd} stepping platform(s). Total: ${nextLevel.platforms.length}.`;
      } else if (action === "REMOVE") {
        if (nextLevel.platforms.length <= 1) {
          return {
            error: "Cannot remove all platforms. The level requires solid surfaces for the player.",
            message: "",
            success: false,
          };
        }
        const countToRemove = Math.min(
          (parameters.count as number) || 1,
          nextLevel.platforms.length - 1,
        );
        nextLevel.platforms = nextLevel.platforms.slice(0, -countToRemove);
        summaryMessage = `Removed ${countToRemove} platform(s). ${nextLevel.platforms.length} remaining.`;
      } else if (action === "RESIZE") {
        const multiplier = (parameters.widthMultiplier as number) || 1.3;
        nextLevel.platforms = nextLevel.platforms.map((p) => ({
          ...p,
          width: clamp(Math.round(p.width * multiplier), 60, 1200),
        }));
        summaryMessage = `Adjusted platform widths by ${(multiplier * 100).toFixed(0)}%.`;
      }
      break;
    }

    case "enemy": {
      if (action === "REMOVE") {
        const count = nextLevel.enemies.length;
        nextLevel.enemies = [];
        summaryMessage = `Removed all ${count} enemies from the level.`;
      } else if (action === "ADD") {
        const countToAdd = clamp((parameters.count as number) || 1, 1, 5);
        const newEnemies: EnemyEntity[] = [];

        for (let i = 0; i < countToAdd; i++) {
          let ex = 450 + i * 160;
          let ey = 380;
          let patrolDist = 80;

          if (nextLevel.platforms.length > 0) {
            const plat = nextLevel.platforms[(i + 1) % nextLevel.platforms.length];
            if (plat) {
              ex = plat.x + Math.round(plat.width / 2) - 16;
              ey = plat.y - 36;
              patrolDist = Math.max(30, Math.round(plat.width * 0.4));
            }
          }

          newEnemies.push({
            height: 36,
            id: createUniqueId("enemy"),
            patrolDistance: patrolDist,
            width: 32,
            x: clamp(Math.round(ex), 40, worldW - 60),
            y: clamp(Math.round(ey), 60, worldH - 60),
          });
        }

        nextLevel.enemies = [...nextLevel.enemies, ...newEnemies];
        summaryMessage = `Added ${countToAdd} patrolling enemy/enemies. Total: ${nextLevel.enemies.length}.`;
      } else if (action === "UPDATE") {
        const mult = (parameters.speedMultiplier as number) || 1.5;
        nextLevel.enemies = nextLevel.enemies.map((e) => ({
          ...e,
          patrolDistance: clamp(Math.round(e.patrolDistance * mult), 30, 400),
        }));
        summaryMessage =
          mult > 1
            ? "Increased enemy patrol speed and range by 50%."
            : "Decreased enemy patrol speed and range by 40%.";
      } else if (action === "SET") {
        const speedVal = (parameters.speed as number) || 100;
        nextLevel.enemies = nextLevel.enemies.map((e) => ({
          ...e,
          patrolDistance: clamp(Math.round(speedVal * 40), 30, 400),
        }));
        summaryMessage = `Set enemy patrol range based on speed factor ${speedVal}.`;
      }
      break;
    }

    case "gravity": {
      const curGravity = nextLevel.physics?.gravityY ?? 1400;
      let newGravity = curGravity;
      if (action === "SET") {
        newGravity = clamp((parameters.value as number) || 1400, 400, 3000);
      } else {
        const mult = (parameters.multiplier as number) || 0.7;
        newGravity = clamp(Math.round(curGravity * mult), 400, 3000);
      }

      nextLevel.physics = {
        gravityY: newGravity,
        jumpVelocity: nextLevel.physics?.jumpVelocity ?? -520,
      };
      summaryMessage = `Updated gravity from ${curGravity} to ${newGravity} (${
        newGravity < curGravity ? "lighter" : "heavier"
      }).`;
      break;
    }

    case "jump": {
      const curJump = nextLevel.physics?.jumpVelocity ?? -520;
      let newJump = curJump;
      if (action === "SET") {
        const val = (parameters.value as number) || -520;
        newJump = clamp(val < 0 ? val : -val, -1000, -300);
      } else {
        const mult = (parameters.multiplier as number) || 1.25;
        // Higher jump means more negative velocity
        newJump = clamp(Math.round(curJump * mult), -1000, -300);
      }

      nextLevel.physics = {
        gravityY: nextLevel.physics?.gravityY ?? 1400,
        jumpVelocity: newJump,
      };
      summaryMessage = `Updated jump velocity to ${newJump} (${
        Math.abs(newJump) > Math.abs(curJump) ? "higher jump" : "lower jump"
      }).`;
      break;
    }

    case "player": {
      if (action === "MOVE") {
        let px = nextLevel.player.x;
        let py = nextLevel.player.y;

        if ("x" in parameters && "y" in parameters) {
          px = parameters.x as number;
          py = parameters.y as number;
        } else if ("direction" in parameters && "offset" in parameters) {
          const dir = parameters.direction as string;
          const offset = parameters.offset as number;
          if (dir === "left") px -= offset;
          if (dir === "right") px += offset;
          if (dir === "up") py -= offset;
          if (dir === "down") py += offset;
        }

        nextLevel.player = {
          ...nextLevel.player,
          x: clamp(Math.round(px), 20, worldW - nextLevel.player.width - 20),
          y: clamp(Math.round(py), 20, worldH - nextLevel.player.height - 20),
        };
        summaryMessage = `Moved player spawn point to (${nextLevel.player.x}, ${nextLevel.player.y}).`;
      }
      break;
    }

    case "goal": {
      if (action === "MOVE") {
        if (!nextLevel.goal) {
          nextLevel.goal = {
            height: 64,
            id: createUniqueId("goal"),
            label: "Goal Flag",
            width: 44,
            x: worldW - 140,
            y: 456,
          };
        }

        let gx = nextLevel.goal.x;
        let gy = nextLevel.goal.y;

        if ("x" in parameters && "y" in parameters) {
          gx = parameters.x as number;
          gy = parameters.y as number;
        } else if ("direction" in parameters && "offset" in parameters) {
          const dir = parameters.direction as string;
          const offset = parameters.offset as number;
          if (dir === "left") gx -= offset;
          if (dir === "right") gx += offset;
          if (dir === "up") gy -= offset;
          if (dir === "down") gy += offset;
        }

        nextLevel.goal = {
          ...nextLevel.goal,
          x: clamp(Math.round(gx), 40, worldW - nextLevel.goal.width - 20),
          y: clamp(Math.round(gy), 40, worldH - nextLevel.goal.height - 20),
        };
        summaryMessage = `Moved goal flag to (${nextLevel.goal.x}, ${nextLevel.goal.y}).`;
      }
      break;
    }

    case "theme": {
      if (action === "CHANGE_THEME" && parameters.themeId) {
        nextTheme = parameters.themeId as ThemeId;
        summaryMessage = `Switched theme to "${nextTheme}".`;
      }
      break;
    }

    case "style": {
      if (action === "CHANGE_STYLE" && parameters.styleId) {
        nextStyle = parameters.styleId as StyleId;
        summaryMessage = `Switched visual style to "${nextStyle}".`;
      }
      break;
    }

    case "game_mode": {
      const newMode = (parameters.mode as GameMode) || "side-scrolling";
      const isSide = newMode === "side-scrolling";
      const newWorldW = isSide ? Math.max(2560, worldW) : 1280;

      nextLevel = {
        ...nextLevel,
        gameMode: newMode,
        world: {
          height: worldH,
          width: newWorldW,
        },
      };
      summaryMessage = `Switched game mode to "${newMode}" (world width: ${newWorldW}px).`;
      break;
    }

    case "world": {
      let targetW = worldW;
      if (action === "SET" && parameters.width) {
        targetW = parameters.width as number;
      } else if (action === "RESIZE" && parameters.widthMultiplier) {
        targetW = Math.round(worldW * (parameters.widthMultiplier as number));
      }
      const safeW = clamp(targetW, 1280, 5120);
      nextLevel = {
        ...nextLevel,
        world: {
          height: worldH,
          width: safeW,
        },
      };
      summaryMessage = `Updated world width to ${safeW}px.`;
      break;
    }

    default: {
      return {
        error: `Unrecognized edit target "${target}".`,
        message: "",
        success: false,
      };
    }
  }

  // Schema Validation Check
  const parseResult = levelSchema.safeParse(nextLevel);
  if (!parseResult.success) {
    const errorDesc = parseResult.error.issues.map((i) => i.message).join("; ");
    return {
      error: `Level modification failed schema validation: ${errorDesc}`,
      message: "",
      success: false,
    };
  }

  return {
    message: summaryMessage || "Game updated successfully.",
    success: true,
    updatedLevel: parseResult.data,
    updatedStyle: nextStyle,
    updatedTheme: nextTheme,
  };
}
