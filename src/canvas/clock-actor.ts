import { Camera } from "./camera";
import { Actor } from "./actor";
import { Clock } from "../clock";
import { ActorCommon } from "./actor-common";
import { ActorRegistry } from "./actor-registry";

export class ClockActor extends Actor {
  private clock: Clock;

  constructor({ common, clock }: { common: ActorCommon, clock: Clock }) {
    super(common);
    this.clock = clock;
  }

  record(): void {
    this.clock.record();
  }

  play(): void {
    this.clock.play();
  }

  stop(): void {
    this.clock.stop();
  }

  reset(common: ActorCommon, hardReset: boolean): void {
    this.clock.reset(common, hardReset);
  }

  setResetListener(listener: (common: ActorCommon, hardReset: boolean) => void): void {
    this.clock.setResetListener(listener);
  } 

  update(_common: ActorCommon, _collisions: number[]): void {
    this.clock.update();
  }

  getClock(): Clock {
    return this.clock;
  }

  draw(common: ActorCommon, ctx: CanvasRenderingContext2D, camera: Camera): void {
    const timeString = this.formatTime(this.clock.getElapsedTime()/1000);

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

  getElapsedTime(): number {
    return this.clock.getElapsedTime();
  }

  clone(registry: ActorRegistry, common: ActorCommon): ClockActor {
    const clonedClock = this.clock.clone();
    const clone = new ClockActor({ common, clock: clonedClock });
    return clone;
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
