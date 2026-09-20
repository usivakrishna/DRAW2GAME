/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Movement System
 *
 * Tracks entity motion, velocities, positions, and patrol boundaries.
 */

export interface MotionState {
  direction?: "left" | "right" | "up" | "down" | undefined;
  id: string;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

export class MovementSystem {
  private entities: Map<string, MotionState> = new Map();

  public registerEntity(id: string, initialX = 0, initialY = 0): MotionState {
    const state: MotionState = { id, vx: 0, vy: 0, x: initialX, y: initialY };
    this.entities.set(id, state);
    return state;
  }

  public unregisterEntity(id: string): boolean {
    return this.entities.delete(id);
  }

  public setVelocity(id: string, vx: number, vy: number): void {
    const state = this.entities.get(id);
    if (state) {
      state.vx = vx;
      state.vy = vy;
    }
  }

  public setPosition(id: string, x: number, y: number): void {
    const state = this.entities.get(id);
    if (state) {
      state.x = x;
      state.y = y;
    }
  }

  public getState(id: string): MotionState | undefined {
    return this.entities.get(id);
  }

  public clear(): void {
    this.entities.clear();
  }

  public destroy(): void {
    this.clear();
  }
}
