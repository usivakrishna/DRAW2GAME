/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * Universal Game Editor State Hook
 *
 * Manages:
 * - Working draft of the GameDefinition as the single source of truth
 * - Undo / Redo history stack
 * - Selection of game entities
 * - Live validation via GenericGameValidator + genre validators
 * - Persistence under active Project ID
 */

import { useCallback, useMemo, useState } from "react";
import type {
  GameDefinition,
  GameObject,
  GameViewport,
} from "@/game/core/game-definition";
import { isPlatformerGameDefinition, type PlatformerGameDefinition } from "@/game/core/platformer-definition";
import { isChessGameDefinition, type ChessGameDefinition } from "@/game/chess/chess-definition";
import { GenericGameValidator } from "@/game/generation/validators/generic-validator";
import { PlatformerValidator } from "@/game/generation/validators/platformer-validator";
import { ChessValidator } from "@/game/generation/validators/chess-validator";
import type { ValidationResult } from "@/game/generation/validators/validation-types";
import { useProjectStore } from "@/store/project-store";
import {
  addGameObject,
  applyUniversalEditCommand,
  removeGameObject,
  updateGameObject,
  updateGameSettings,
} from "./game-definition-modifier";
import type { GameEditCommand } from "./types";

export interface UniversalEditorOptions {
  initialDefinition: GameDefinition;
  onSave?: ((def: GameDefinition) => void) | undefined;
  projectId: string;
}

export function validateGameDefinition(def: GameDefinition): ValidationResult {
  const genericResult = GenericGameValidator.validate(def);
  if (!genericResult.isValid) return genericResult;

  if (def.gameType === "platformer" && isPlatformerGameDefinition(def)) {
    const platResult = PlatformerValidator.validate(def as PlatformerGameDefinition);
    return {
      errors: [...genericResult.errors, ...platResult.errors],
      isValid: genericResult.isValid && platResult.isValid,
      issues: [...genericResult.issues, ...platResult.issues],
      warnings: [...genericResult.warnings, ...platResult.warnings],
    };
  }

  if (def.gameType === "chess" && isChessGameDefinition(def)) {
    const chessResult = ChessValidator.validate(def as ChessGameDefinition);
    return {
      errors: [...genericResult.errors, ...chessResult.errors],
      isValid: genericResult.isValid && chessResult.isValid,
      issues: [...genericResult.issues, ...chessResult.issues],
      warnings: [...genericResult.warnings, ...chessResult.warnings],
    };
  }

  return genericResult;
}

export function useUniversalEditor({
  initialDefinition,
  onSave,
  projectId,
}: UniversalEditorOptions) {
  const setProjectGameDefinition = useProjectStore(
    (state) => state.setProjectGameDefinition,
  );

  // Core definition states
  const [savedSnapshot, setSavedSnapshot] = useState<GameDefinition>(initialDefinition);
  const [draftDefinition, setDraftDefinition] = useState<GameDefinition>(initialDefinition);

  // Undo / Redo history stacks
  const [past, setPast] = useState<GameDefinition[]>([]);
  const [future, setFuture] = useState<GameDefinition[]>([]);

  // Selection
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Push new state to history stack
  const pushState = useCallback(
    (newDef: GameDefinition) => {
      setPast((prev) => [...prev, draftDefinition]);
      setFuture([]);
      setDraftDefinition(newDef);
    },
    [draftDefinition],
  );

  // Selected object lookup
  const selectedObject = useMemo(() => {
    if (!selectedObjectId) return null;
    return draftDefinition.objects.find((o) => o.id === selectedObjectId) ?? null;
  }, [draftDefinition.objects, selectedObjectId]);

  // Live validation
  const validation = useMemo(() => {
    return validateGameDefinition(draftDefinition);
  }, [draftDefinition]);

  // Dirty flag
  const isDirty = useMemo(() => {
    return JSON.stringify(draftDefinition) !== JSON.stringify(savedSnapshot);
  }, [draftDefinition, savedSnapshot]);

  // Actions
  const selectObject = useCallback((id: string | null) => {
    setSelectedObjectId(id);
  }, []);

  const moveObject = useCallback(
    (id: string, x: number, y: number) => {
      const updated = updateGameObject(draftDefinition, id, { x, y });
      pushState(updated);
    },
    [draftDefinition, pushState],
  );

  const resizeObject = useCallback(
    (id: string, width: number, height: number, radius?: number) => {
      const changes: Partial<GameObject> = { height, width };
      if (radius !== undefined) changes.radius = radius;
      const updated = updateGameObject(draftDefinition, id, changes);
      pushState(updated);
    },
    [draftDefinition, pushState],
  );

  const updateObjectProperties = useCallback(
    (id: string, changes: Partial<GameObject>) => {
      const updated = updateGameObject(draftDefinition, id, changes);
      pushState(updated);
    },
    [draftDefinition, pushState],
  );

  const addObject = useCallback(
    (newObj: GameObject) => {
      const updated = addGameObject(draftDefinition, newObj);
      pushState(updated);
      setSelectedObjectId(newObj.id);
    },
    [draftDefinition, pushState],
  );

  const removeObject = useCallback(
    (id: string) => {
      try {
        const updated = removeGameObject(draftDefinition, id);
        pushState(updated);
        if (selectedObjectId === id) {
          setSelectedObjectId(null);
        }
        return { success: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Failed to remove object",
          success: false,
        };
      }
    },
    [draftDefinition, pushState, selectedObjectId],
  );

  const updateSettings = useCallback(
    (changes: {
      fps?: number | undefined;
      gravityY?: number | undefined;
      jumpVelocity?: number | undefined;
      name?: string | undefined;
      styleId?: string | undefined;
      themeId?: string | undefined;
      viewport?: GameViewport | undefined;
      world?: { height: number; width: number } | undefined;
    }) => {
      const updated = updateGameSettings(draftDefinition, changes);
      pushState(updated);
    },
    [draftDefinition, pushState],
  );

  const applyAiCommand = useCallback(
    (command: GameEditCommand) => {
      const result = applyUniversalEditCommand(draftDefinition, command);
      if (result.success && result.updatedDefinition) {
        pushState(result.updatedDefinition);
        return { message: result.message, success: true };
      }
      return { error: result.error ?? "Failed to apply AI command", success: false };
    },
    [draftDefinition, pushState],
  );

  // Undo / Redo
  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    if (!previous) return;

    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [draftDefinition, ...prev]);
    setDraftDefinition(previous);
  }, [draftDefinition, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    if (!next) return;

    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, draftDefinition]);
    setDraftDefinition(next);
  }, [draftDefinition, future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Reset to last saved snapshot
  const resetChanges = useCallback(() => {
    setDraftDefinition(savedSnapshot);
    setPast([]);
    setFuture([]);
    setSelectedObjectId(null);
  }, [savedSnapshot]);

  // Save changes
  const saveChanges = useCallback(() => {
    const currentValidation = validateGameDefinition(draftDefinition);
    if (!currentValidation.isValid) {
      return {
        errors: currentValidation.errors,
        isValid: false,
        success: false,
      };
    }

    setProjectGameDefinition(projectId, draftDefinition);
    setSavedSnapshot(draftDefinition);

    if (onSave) {
      onSave(draftDefinition);
    }

    return {
      definition: draftDefinition,
      isValid: true,
      success: true,
    };
  }, [draftDefinition, onSave, projectId, setProjectGameDefinition]);

  return {
    addObject,
    applyAiCommand,
    canRedo,
    canUndo,
    draftDefinition,
    futureCount: future.length,
    historyCount: past.length,
    isDirty,
    moveObject,
    redo,
    removeObject,
    resetChanges,
    resizeObject,
    saveChanges,
    selectObject,
    selectedObject,
    selectedObjectId,
    undo,
    updateObjectProperties,
    updateSettings,
    validation,
  };
}
