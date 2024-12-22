import { Camera } from "./camera";
import { Actor } from "./actor";
import { ActorCommon } from "../utils/types";

export class Clock extends Actor {
  private timeElapsed: number; // Time in seconds
  private previousTimeElapsed: number;
  private isActive: boolean;
  private lastUpdateTime: number;
  private onResetListeners: (() => void)[] = [];

  constructor({ common }: { common: ActorCommon }) {
    super(common);
    this.timeElapsed = 0;
    this.isActive = false;
    this.lastUpdateTime = performance.now();
  }

  start(): void {
    this.isActive = true;
    this.lastUpdateTime = performance.now();
  }

  stop(): void {
    this.isActive = false;
  }

  reset(): void {
    this.timeElapsed = 0;
    for(const listener of this.onResetListeners) {
      listener();
    }
  }

  setResetListener(listener: () => void): void {
    this.onResetListeners.push(listener);
  } 

  update(collisions: number[]): void {
    if (this.isActive) {
      const now = performance.now();
      this.previousTimeElapsed = this.timeElapsed;
      this.timeElapsed += (now - this.lastUpdateTime) / 1000; // Convert ms to seconds
      this.lastUpdateTime = now;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const timeString = this.formatTime(this.timeElapsed);

    // Position the clock in the lower right corner
    const padding = 10; // Padding from the edge
    const x = ctx.canvas.width - padding;
    const y = ctx.canvas.height - padding;

    ctx.fillStyle = "black";

    const WIDTH = 70;
    const HEIGHT = 25;
    ctx.fillRect(x - WIDTH + 5, y - HEIGHT, WIDTH, HEIGHT);

    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";

    ctx.fillText(timeString, x, y);
  }

  getTimeElapsed(): number {
    return this.timeElapsed * 1000; // Convert to milliseconds
  }

  getPreviousTimeElapsed(): number {
    return this.previousTimeElapsed * 1000; // Convert to milliseconds
  }

  private formatTime(time: number): string {
    //const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${this.padZero(seconds)}.${this.padZero(milliseconds)}s`;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}
