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
import { ClockActor } from "./clock-actor";
import CoordinateRecorder from "./coordinate-recorder";
import { throttle } from "lodash";
import { PLAYER_RADIUS } from "../utils/constants";
import { Clock } from "../clock";

export class Mouse extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private bufferTranslation: { x: number; y: number };
  private common: ActorCommon;
  private clock: ClockActor;
  private canvas: HTMLCanvasElement;
  private addActor: (actor: Actor) => void;
  private camera: Camera;

  private collider: Collider;
  private hoveredActor: Actor | null;
  private draggedActor: Actor | null;
  private draggedMouseCoordinates: CoordinateRecorder;
  private throttledSetPoint: (coord: Coordinate) => void;

  private mouseDown: MouseEvent;
  private mouseMove: MouseEvent;
  private mouseUp: MouseEvent;

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
    clock: ClockActor;
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
    this.clock = clock;
    this.mouseDown = null;
    this.mouseMove = null;
    this.mouseUp = null;
    this.canvas = canvas;
    this.camera = camera;
    this.addActor = addActor;

    canvas.addEventListener("mousedown", (event) => {
      this.mouseDown = event;
    });

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      this.mouseMove = event;
    });

    canvas.addEventListener("mouseup", (event) => {
      this.mouseUp = event;
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

    if (this.draggedMouseCoordinates != null) {
      this.draggedMouseCoordinates.drawPath(ctx, (coord: Coordinate) => {
        return camera.toScreenCoord(coord.x, coord.y);
      }, "red");
    }
  }

  update(collisions: number[]): void {
    if(this.mouseDown != null) {
      const event = this.mouseDown;
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      const worldCoords = this.camera.toWorldCoord(canvasX, canvasY);
      if (this.hoveredActor == null) {
        this.addActor(
          new Player({
            common: this.common,
            clock: this.clock,
            x: worldCoords.x,
            y: worldCoords.y,
            radius: PLAYER_RADIUS,
          })
        );
      } else {
        this.draggedMouseCoordinates = new CoordinateRecorder({x: worldCoords.x, y: worldCoords.y});
        // Not sure if this matters in practice or not but we can fix this if players are starting at the wrong spots
        this.draggedMouseCoordinates.startRecording(this.clock.getClock());
        this.common.scene.setReplayState("record");
        this.draggedActor = this.hoveredActor;

        // We need to reset the positions AND movement paths of all players here
        this.clock.reset(true);
        
        // And reset the target path of the dragged player (because we're about to create a new one!)
        if(this.draggedActor instanceof Player) {
          this.draggedActor.resetTargetPath();
        }
        this.clock.start();
      }
      this.mouseDown = null;
    }

    if(this.mouseMove != null) {
      const event = this.mouseMove;
      const canvasX = event.offsetX;
      const canvasY = event.offsetY;
      const worldCoords = this.camera.toWorldCoord(canvasX, canvasY);
      this.bufferTranslation = worldCoords;
      if (this.draggedMouseCoordinates != null) {
        this.draggedMouseCoordinates.setPoint(worldCoords);
      }
      if (this.draggedActor instanceof Player) {
        this.draggedActor.setTargetPath(this.draggedMouseCoordinates);
      }
      this.mouseMove = null;
    } 

    if(this.mouseUp != null) {
      if (this.draggedActor instanceof Player) {
        this.draggedActor.setTargetPath(this.draggedMouseCoordinates);
      }
      this.common.scene.setReplayState("replay");
      this.draggedMouseCoordinates = null;
      this.draggedActor = null;
      this.clock.stop();

      // We need to reset only the positions of the players (but keep the paths!)
      this.clock.reset(false);
      this.mouseUp = null;
    }

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
