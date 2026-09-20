/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Camera System
 *
 * Generic viewport and camera control for 2D games.
 * Tracks viewport dimensions, zoom, scroll position, and target following.
 */

export interface CameraState {
  height: number;
  scrollX: number;
  scrollY: number;
  targetId: string | null;
  width: number;
  zoom: number;
}

export class CameraSystem {
  private state: CameraState = {
    height: 720,
    scrollX: 0,
    scrollY: 0,
    targetId: null,
    width: 1280,
    zoom: 1,
  };

  constructor(viewport?: { height: number; width: number }) {
    if (viewport) {
      this.state.width = viewport.width;
      this.state.height = viewport.height;
    }
  }

  public setViewport(width: number, height: number): void {
    this.state.width = width;
    this.state.height = height;
  }

  public setScroll(x: number, y: number): void {
    this.state.scrollX = x;
    this.state.scrollY = y;
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, zoom);
  }

  public follow(targetId: string | null): void {
    this.state.targetId = targetId;
  }

  public getState(): Readonly<CameraState> {
    return { ...this.state };
  }

  public destroy(): void {
    this.state.targetId = null;
  }
}
