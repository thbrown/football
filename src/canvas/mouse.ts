import {
  Collider,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { ActorCommon, Coordinate } from "../utils/types";
import { Actor } from "./actor";
import { Player } from "./player";
import { Clock } from "./clock";
import CoordinateRecorder from "./coordinate-recordet";
import { throttle } from "lodash";

export class Mouse extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private bufferTranslation: { x: number; y: number };
  private common: ActorCommon;

  private collider: Collider;
  private hoveredActor: Actor | null;
  private draggedActor: Actor | null;
  private coordinator: CoordinateRecorder;
  private throttledSetPoint: (coord: Coordinate) => void;

  constructor({
    common,
    camera,
    canvas,
    radius,
    clock,
    addActor,
  }: {
    common: ActorCommon;
    camera: Camera;
    canvas: HTMLCanvasElement;
    radius: number;
    clock: Clock;
    addActor: (actor: Actor) => void;
  }) {
    const colliderDesc =
      common.rapier.ColliderDesc.ball(radius).setSensor(true);
    const collider = common.world.createCollider(colliderDesc);
    super(common, collider.handle);
    this.collider = collider;
    this.x = -9999999;
    this.y = -9999999;
    this.radius = radius;
    this.common = common;
    this.hoveredActor = null;
    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      const canvasX = event.offsetX;
      const canvasY = event.offsetY;
      const worldCoords = camera.toWorldCoord(canvasX, canvasY);
      this.bufferTranslation = worldCoords;
      if (this.coordinator != null) {
        this.coordinator.setPoint(worldCoords);
      }
    });

    canvas.addEventListener("mousedown", (event) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      const worldCoords = camera.toWorldCoord(canvasX, canvasY);
      if (this.hoveredActor == null) {
        addActor(
          new Player({
            common,
            clock,
            x: worldCoords.x,
            y: worldCoords.y,
            radius: 0.75,
          })
        );
      } else {
        this.coordinator = new CoordinateRecorder();
        this.coordinator.startRecording();
        console.log("Selected actor", this.hoveredActor);
        this.draggedActor = this.hoveredActor;
      }
      clock.start();
    });

    canvas.addEventListener("mouseup", (event) => {
      console.log(
        "MOUSE UP",
        this.hoveredActor instanceof Player,
        this.hoveredActor
      );
      if (this.draggedActor instanceof Player) {
        this.draggedActor.setTargetPath(this.coordinator);
      }
      this.hoveredActor = null;
      this.coordinator = null;
      this.draggedActor = null;
      clock.stop();
      clock.reset();
    });
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();
    const screenRadius = this.radius * screenScale;

    // Draw the ball
    ctx.beginPath();
    ctx.arc(screenCoords.x, screenCoords.y, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();

    if (this.coordinator != null) {
      this.coordinator.drawPath(ctx, (coord: Coordinate) => {
        return camera.toScreenCoord(coord.x, coord.y);
      });
    }
  }

  update(collisions: number[]): void {
    if (this.bufferTranslation) {
      this.collider.setTranslation(this.bufferTranslation);
      this.x = this.bufferTranslation.x;
      this.y = this.bufferTranslation.y;
    }
    // Just get the top actor
    this.hoveredActor = null;
    for (let collision of collisions) {
      this.hoveredActor = this.common.actorRegistry.get(collision);
      break;
    }
  }
}
