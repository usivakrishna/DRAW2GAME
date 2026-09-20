/**
 * DRAW2GAME — Universal Game Engine Architecture
 * UniversalGameEngine Implementation
 *
 * Implements the canonical GameEngine<GameDefinition> contract.
 * Interprets any generic GameDefinition (platformer, chess, puzzle, etc.)
 * by activating only the required runtime systems based on capabilities.
 *
 * Architecture:
 * GameDefinition -> UniversalGameEngine -> Runtime Systems (Physics, Board, Turn, Rules, etc.) -> Playable Game
 */

import {
  type ChessPayload,
  type ChessSquare,
  createDefaultChessGameDefinition,
  createDefaultChessPayload,
} from "@/game/chess/chess-definition";
import { ChessRules, type MoveExecutionResult } from "@/game/chess/chess-rules";
import {
  type GameCapability,
  inferCapabilities,
} from "@/game/core/game-capabilities";
import type {
  GameDefinition,
  GameObject,
  GameType,
} from "@/game/core/game-definition";
import type {
  GameEngine,
  GameEngineInitOptions,
} from "@/game/core/game-engine";
import {
  gameDefinitionToLevelDefinition,
  isPlatformerGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import type { PhaserGameBridge } from "@/game/PhaserGameBridge";
import { GameStateManager } from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";
import {
  BoardSystem,
  CameraSystem,
  CollisionSystem,
  GameStateSystem,
  MovementSystem,
  type BridgeFactory,
  PhysicsSystem,
  RuleSystem,
  ScoreSystem,
  TurnSystem,
  WinConditionSystem,
} from "./systems";

export type UniversalEngineStateChangeListener = (state: unknown) => void;

export class UniversalGameEngine implements GameEngine<GameDefinition> {
  public readonly engineId = "universal-2d-engine";

  // Core Lifecycle Flags
  private _isInitialized = false;
  private _isRunning = false;
  private container: HTMLElement | null = null;
  private currentDefinition: GameDefinition | null = null;
  private activeCapabilities: Set<GameCapability> = new Set();
  private stateChangeListeners: Set<UniversalEngineStateChangeListener> = new Set();

  // Themes & Styles
  private currentStyleId: StyleId = "clean";
  private currentThemeId: ThemeId = "classic";

  // Modular Runtime Systems
  public readonly gameState: GameStateSystem;
  public readonly score: ScoreSystem;
  public readonly turn: TurnSystem;
  public readonly board: BoardSystem;
  public readonly rules: RuleSystem;
  public readonly physics: PhysicsSystem;
  public readonly collision: CollisionSystem;
  public readonly movement: MovementSystem;
  public readonly camera: CameraSystem;
  public readonly winCondition: WinConditionSystem;

  // Bridge factory for testing injection
  private bridgeFactory?: BridgeFactory | undefined;

  constructor(bridgeFactory?: BridgeFactory | undefined) {
    this.bridgeFactory = bridgeFactory;
    this.gameState = new GameStateSystem();
    this.score = new ScoreSystem();
    this.turn = new TurnSystem();
    this.board = new BoardSystem();
    this.rules = new RuleSystem();
    this.physics = new PhysicsSystem(this.bridgeFactory);
    this.collision = new CollisionSystem();
    this.movement = new MovementSystem();
    this.camera = new CameraSystem();
    this.winCondition = new WinConditionSystem();

    this.registerDefaultRuleActions();
  }

  // ==========================================
  // GameEngine Contract Properties
  // ==========================================

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get gameType(): GameType {
    return this.currentDefinition?.gameType ?? "platformer";
  }

  public get capabilities(): readonly GameCapability[] {
    return Array.from(this.activeCapabilities);
  }

  public hasCapability(cap: GameCapability): boolean {
    return this.activeCapabilities.has(cap);
  }

  public getActiveSystems(): string[] {
    const active: string[] = ["gameState", "rules", "winCondition"];
    if (this.hasCapability("physics")) active.push("physics");
    if (this.hasCapability("collision")) active.push("collision");
    if (this.hasCapability("movement")) active.push("movement");
    if (this.hasCapability("camera")) active.push("camera");
    if (this.hasCapability("board") || this.hasCapability("grid")) active.push("board");
    if (this.hasCapability("turns")) active.push("turn");
    if (this.hasCapability("scoring") || this.hasCapability("collectibles")) active.push("score");
    return active;
  }

  // ==========================================
  // GameEngine Contract Lifecycle Methods
  // ==========================================

  public initialize(options: GameEngineInitOptions): void {
    this.container = options.container;

    if (options.gameStateManager) {
      this.gameState.setManager(options.gameStateManager);
    } else if (!this.gameState.getManager()) {
      this.gameState.setManager(new GameStateManager(0));
    }

    if (options.settings?.themeId) {
      this.currentThemeId = options.settings.themeId as ThemeId;
    }
    if (options.settings?.styleId) {
      this.currentStyleId = options.settings.styleId as StyleId;
    }

    this._isInitialized = true;
  }

  public async load(definition: GameDefinition): Promise<void> {
    this.currentDefinition = definition;

    // 1. Resolve and activate capabilities
    const declaredCaps = definition.capabilities && definition.capabilities.length > 0
      ? definition.capabilities
      : inferCapabilities(definition.gameType, definition.objects, definition.rules, definition.typePayload);

    this.activeCapabilities = new Set(declaredCaps);

    // 2. Load rules into RuleSystem
    this.rules.loadRules(definition.rules ?? []);

    // 3. Load viewport into CameraSystem
    if (definition.viewport) {
      this.camera.setViewport(definition.viewport.width, definition.viewport.height);
    }

    // 4. Update themes/styles
    if (definition.settings?.themeId) {
      this.currentThemeId = definition.settings.themeId as ThemeId;
    }
    if (definition.settings?.styleId) {
      this.currentStyleId = definition.settings.styleId as StyleId;
    }

    // 5. Activate Physics Subsystem (Phaser + Matter.js) ONLY if physics capability is present AND container exists
    if (this.hasCapability("physics") && this.container) {
      const manager = this.gameState.getManager() ?? new GameStateManager(0);
      this.gameState.setManager(manager);

      let levelDef;
      if (isPlatformerGameDefinition(definition)) {
        levelDef = gameDefinitionToLevelDefinition(definition);
      } else {
        // Build basic platformer level adapter from generic definition
        levelDef = gameDefinitionToLevelDefinition(definition as PlatformerGameDefinition);
      }

      await this.physics.activate({
        bridgeFactory: this.bridgeFactory,
        container: this.container,
        gameStateManager: manager,
        levelDefinition: levelDef,
        styleId: this.currentStyleId,
        themeId: this.currentThemeId,
      });
    } else {
      // Ensure physics is deactivated if definition does not require physics or no container attached
      this.physics.deactivate();
    }

    // 6. Activate Board & Turn Systems if board/turn capabilities are present
    if (this.hasCapability("board") || this.hasCapability("turns")) {
      this.initializeBoardAndTurnSystems(definition);
    }

    // 7. Setup Score System
    const collectibleObjects = definition.objects.filter(
      (o) => o.type === "coin" || o.type === "gem" || o.type === "collectible"
    );
    this.score.reset(collectibleObjects.length, 3);

    this._isRunning = true;
    this.notifyStateChange();
  }

  public start(): void {
    if (!this._isInitialized) {
      throw new Error("Cannot start UniversalGameEngine before initialize() is called");
    }
    this._isRunning = true;
    this.gameState.play();
  }

  public pause(): void {
    this._isRunning = false;
    this.gameState.pause();
    this.physics.pause();
  }

  public resume(): void {
    this._isRunning = true;
    this.gameState.resume();
    this.physics.resume();
  }

  public restart(): void {
    if (this.hasCapability("physics")) {
      this.physics.restart();
      this.gameState.reset();
    } else if (this.currentDefinition?.gameType === "chess") {
      const id = this.currentDefinition.id || "chess-game";
      const freshDef = createDefaultChessGameDefinition(id, this.currentDefinition.name);
      this.currentDefinition = freshDef;
      this.initializeBoardAndTurnSystems(freshDef);
    } else {
      this.gameState.reset();
      this.score.reset();
    }

    this._isRunning = true;
    this.notifyStateChange();
  }

  public destroy(): void {
    this.physics.destroy();
    this.gameState.destroy();
    this.score.destroy();
    this.turn.destroy();
    this.board.destroy();
    this.rules.destroy();
    this.collision.destroy();
    this.movement.destroy();
    this.camera.destroy();
    this.winCondition.destroy();

    this.container = null;
    this.currentDefinition = null;
    this.activeCapabilities.clear();
    this.stateChangeListeners.clear();
    this._isInitialized = false;
    this._isRunning = false;
  }

  // ==========================================
  // Generic Object Manipulation
  // ==========================================

  public createObject(object: GameObject): void {
    if (!this.currentDefinition) return;
    this.currentDefinition.objects.push(object);

    if (object.properties?.square && typeof object.properties.square === "string") {
      this.board.setPiece({
        color: typeof object.properties.color === "string" ? object.properties.color : undefined,
        id: object.id,
        properties: object.properties,
        square: object.properties.square,
        type: object.type,
      });
    }

    this.movement.registerEntity(object.id, object.x, object.y);
    this.notifyStateChange();
  }

  public removeObject(objectId: string): boolean {
    if (!this.currentDefinition) return false;
    const initialLen = this.currentDefinition.objects.length;
    this.currentDefinition.objects = this.currentDefinition.objects.filter((o) => o.id !== objectId);

    this.board.removePiece(objectId);
    this.movement.unregisterEntity(objectId);

    const removed = this.currentDefinition.objects.length < initialLen;
    if (removed) this.notifyStateChange();
    return removed;
  }

  public getObject(objectId: string): GameObject | undefined {
    return this.currentDefinition?.objects.find((o) => o.id === objectId);
  }

  public getObjects(): GameObject[] {
    return this.currentDefinition ? [...this.currentDefinition.objects] : [];
  }

  // ==========================================
  // Rule Execution & Event Dispatching
  // ==========================================

  public executeRule(ruleId: string, context?: unknown): boolean {
    return this.rules.executeRule(ruleId, context);
  }

  public triggerEvent(eventName: string, context?: unknown): void {
    this.rules.triggerEvent(eventName, context);
  }

  // ==========================================
  // Accessors & Subsystem Inspection
  // ==========================================

  public getDefinition(): GameDefinition | null {
    return this.currentDefinition;
  }

  public getPayload(): unknown {
    return this.currentDefinition?.typePayload ?? null;
  }

  public getContainer(): HTMLElement | null {
    return this.container;
  }

  public getBridge(): PhaserGameBridge | null {
    return this.physics.getBridge();
  }

  public getGameStateManager(): GameStateManager | null {
    return this.gameState.getManager();
  }

  public setTheme(themeId: ThemeId, styleId?: StyleId): void {
    this.currentThemeId = themeId;
    if (styleId) this.currentStyleId = styleId;
    this.physics.setTheme(themeId, styleId);
    if (this.currentDefinition) {
      this.currentDefinition.settings.themeId = themeId;
      if (styleId) this.currentDefinition.settings.styleId = styleId;
    }
  }

  // ==========================================
  // Turn & Board Operations (Chess & Turn Games)
  // ==========================================

  public selectSquare(square: ChessSquare | string | null): void {
    const payload = this.getChessPayload();
    if (!payload) return;

    if (!square) {
      payload.selectedSquare = null;
      payload.legalMovesForSelected = undefined;
      this.board.clearSelection();
      this.notifyStateChange();
      return;
    }

    const sq = square as ChessSquare;
    const piece = ChessRules.getPieceAt(payload.pieces, sq);
    if (piece && piece.color === payload.currentTurn) {
      const legalMoves = ChessRules.getLegalMoves(
        piece,
        payload.pieces,
        payload.enPassantTargetSquare
      );
      payload.selectedSquare = sq;
      payload.legalMovesForSelected = legalMoves;
      this.board.selectSquare(sq, legalMoves);
    } else {
      payload.selectedSquare = null;
      payload.legalMovesForSelected = undefined;
      this.board.clearSelection();
    }

    this.notifyStateChange();
  }

  public makeMove(
    from: ChessSquare | string,
    to: ChessSquare | string,
    promotionType: "queen" | "rook" | "bishop" | "knight" = "queen"
  ): MoveExecutionResult {
    const payload = this.getChessPayload();
    if (!payload) {
      throw new Error("No turn/board game currently loaded in UniversalGameEngine");
    }

    const result = ChessRules.executeMove(
      payload,
      from as ChessSquare,
      to as ChessSquare,
      promotionType
    );

    if (result.success) {
      const updated = result.updatedPayload;
      if (this.currentDefinition) {
        this.currentDefinition.typePayload = updated;
      }
      this.turn.setTurn(updated.currentTurn);
      this.board.loadPieces(
        updated.pieces.map((p) => ({
          color: p.color,
          id: p.id,
          square: p.square,
          type: p.type,
        }))
      );
      this.board.clearSelection();

      // Trigger rule checks (check, checkmate)
      if (result.move?.isCheckmate) {
        this.rules.triggerEvent("CHECKMATE", result.move);
        this.gameState.win();
      } else if (result.move?.isCheck) {
        this.rules.triggerEvent("CHECK", result.move);
      }

      this.notifyStateChange();
    }

    return result;
  }

  public flipBoard(): void {
    const payload = this.getChessPayload();
    if (!payload) return;

    const nextOrient = payload.orientation === "white" ? "black" : "white";
    payload.orientation = nextOrient;
    this.board.setOrientation(nextOrient);
    this.notifyStateChange();
  }

  public onStateChange(listener: UniversalEngineStateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  // ==========================================
  // Private System Initializers & Event Handlers
  // ==========================================

  private initializeBoardAndTurnSystems(definition: GameDefinition): void {
    if (definition.gameType === "chess") {
      let payload = definition.typePayload as ChessPayload | undefined;
      if (!payload || !Array.isArray(payload.pieces)) {
        payload = createDefaultChessPayload();
        definition.typePayload = payload;
      }

      this.board.setOrientation(payload.orientation ?? "white");
      this.board.loadPieces(
        payload.pieces.map((p) => ({
          color: p.color,
          id: p.id,
          square: p.square,
          type: p.type,
        }))
      );

      this.turn.setParticipants(["white", "black"]);
      this.turn.setTurn(payload.currentTurn ?? "white");
    }
  }

  private registerDefaultRuleActions(): void {
    this.rules.registerActionHandler("INCREASE_SCORE", (rule) => {
      const points = (rule.parameters?.points as number) ?? 10;
      this.score.addScore(points);
    });

    this.rules.registerActionHandler("GAME_OVER_WIN", () => {
      this.gameState.win();
    });

    this.rules.registerActionHandler("GAME_OVER_LOSE", () => {
      this.gameState.lose();
    });
  }

  private getChessPayload(): ChessPayload | null {
    if (this.currentDefinition && this.currentDefinition.typePayload) {
      return this.currentDefinition.typePayload as ChessPayload;
    }
    return null;
  }

  private notifyStateChange(): void {
    const payload = this.getPayload();
    for (const listener of this.stateChangeListeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error("Error in UniversalGameEngine state change listener:", err);
      }
    }
  }
}

/**
 * Factory helper function to instantiate a UniversalGameEngine.
 */
export function createUniversalGameEngine(
  definition?: GameDefinition | undefined,
  bridgeFactory?: BridgeFactory | undefined
): UniversalGameEngine {
  const engine = new UniversalGameEngine(bridgeFactory);
  if (definition) {
    void engine.load(definition);
  }
  return engine;
}
