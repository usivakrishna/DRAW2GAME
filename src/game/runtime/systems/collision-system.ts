/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Collision System
 *
 * Manages collision boundaries, detection queries, and event dispatching.
 */

export interface BoundingBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface CollisionEvent {
  bodyAId: string;
  bodyBId: string;
  typeA: string;
  typeB: string;
}

export type CollisionListener = (event: CollisionEvent) => void;

export class CollisionSystem {
  private listeners: Set<CollisionListener> = new Set();

  public checkAABB(boxA: BoundingBox, boxB: BoundingBox): boolean {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  public dispatchCollision(event: CollisionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in CollisionSystem listener:", err);
      }
    }
  }

  public onCollision(listener: CollisionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }
}
