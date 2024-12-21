import { Collider, EventQueue, RigidBody, World } from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { ActorCommon, ActorRegistry, Rapier } from "../utils/types";
import { Actor } from "./actor";

const TICK_WIDTH = 2;

export class Field extends Actor {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private collider: Collider;
  private rigidBody: RigidBody;
  private common: ActorCommon;

  constructor({
    common,
    x,
    y,
    width,
    height,
  }: {
    common: ActorCommon;
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    super(common);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();

    const screenWidth = this.width * screenScale;
    const screenHeight = this.height * screenScale;

    // Draw the grass
    ctx.fillStyle = "green";
    ctx.fillRect(
      screenCoords.x - screenWidth / 2,
      screenCoords.y - screenHeight / 2,
      screenWidth,
      screenHeight
    );

    // Draw 10 yard lines
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    for (let i = -this.height / 2; i <= this.height / 2; i += 10) {
      const screenLineStartCoord = camera.toScreenCoord(
        this.x - this.width / 2,
        this.y + i
      );
      const screenLineEndCoord = camera.toScreenCoord(
        this.x + this.width / 2,
        this.y + i
      );
      ctx.beginPath();
      ctx.moveTo(screenLineStartCoord.x, screenLineStartCoord.y);
      ctx.lineTo(screenLineEndCoord.x, screenLineEndCoord.y);
      ctx.stroke();
      ctx.closePath();
    }

    // Draw left tick marks
    ctx.fillStyle = "white";
    ctx.lineWidth = 1;
    for (let i = -this.height / 2; i <= this.height / 2; i += 1) {
      const screenLineStartCoord = camera.toScreenCoord(
        this.x - this.width / 2,
        this.y + i
      );
      const screenLineEndCoord = camera.toScreenCoord(
        this.x - this.width / 2 + TICK_WIDTH,
        this.y + i
      );
      ctx.beginPath();
      ctx.moveTo(screenLineStartCoord.x, screenLineStartCoord.y);
      ctx.lineTo(screenLineEndCoord.x, screenLineEndCoord.y);
      ctx.stroke();
      ctx.closePath();
    }

    // Draw right tick marks
    for (let i = -this.height / 2; i <= this.height / 2; i += 1) {
      const screenLineStartCoord = camera.toScreenCoord(
        this.x + this.width / 2,
        this.y + i
      );
      const screenLineEndCoord = camera.toScreenCoord(
        this.x + this.width / 2 - TICK_WIDTH,
        this.y + i
      );
      ctx.beginPath();
      ctx.moveTo(screenLineStartCoord.x, screenLineStartCoord.y);
      ctx.lineTo(screenLineEndCoord.x, screenLineEndCoord.y);
      ctx.stroke();
      ctx.closePath();
    }
  }

  update(collisions: number[]): void {}
}
