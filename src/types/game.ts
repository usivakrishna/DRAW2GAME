export type GameStatus = "idle" | "loading" | "paused" | "playing" | "won" | "lost";

export interface GameRuntimeSettings {
  gravityY: number;
  jumpVelocity: number;
}
