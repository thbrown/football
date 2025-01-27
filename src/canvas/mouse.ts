import {
  Collider,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { Coordinate } from "../utils/types";
import { ActorCommon } from "./actor-common";
import { Actor } from "./actor";
import { Player } from "./player";
import { ClockActor } from "./clock-actor";
import CoordinateRecorder from "./coordinate-recorder";
import { throttle } from "lodash";
import { PLAYER_RADIUS } from "../utils/constants";
import { Clock } from "../clock";
import { Football } from "./football";

export class Mouse extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private bufferTranslation: { x: number; y: number };
  private common: ActorCommon;
  private clock: ClockActor;
  private canvas: HTMLCanvasElement;
  private camera: Camera;

  private collider: Collider;
  private hoveredActor: Actor | null;
  private draggedActor: Actor | null;
  private draggedMouseCoordinates: CoordinateRecorder;
  private throttledSetPoint: (coord: Coordinate) => void;

  private mouseDown: MouseEvent | null;
  private mouseMove: MouseEvent | null;
  private mouseUp: MouseEvent | null;

  constructor({
    common,
    camera,
    canvas,
    radius,
    clock,
  }: {
    common: ActorCommon;
    camera: Camera;
    canvas: HTMLCanvasElement;
    radius: number;
    clock: ClockActor;
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

    canvas.addEventListener("mousedown", (event) => {
      this.mouseDown = event;
    });

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      this.mouseMove = event;
    });

    canvas.addEventListener("mouseup", (event) => {
      this.mouseUp = event;
    });

    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
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
      if(this.mouseDown.button === 2) {
        console.log("Right-click down detected");
        if(this.hoveredActor instanceof Player) {
          this.hoveredActor.deleteDescendants();
          this.common.actorRegistry.removeActor(this.hoveredActor);
          // Remove footbal for player 0 too
        }
        this.clock.reset(true);
      } else if(this.mouseDown.button === 0) {
        console.log("Left-click down detected");
        const event = this.mouseDown;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const worldCoords = this.camera.toWorldCoord(canvasX, canvasY);
        if (this.hoveredActor == null) {
          const playerToAdd = new Player({
            common: this.common,
            clock: this.clock,
            x: worldCoords.x,
            y: worldCoords.y,
            radius: PLAYER_RADIUS,
          });
          this.common.actorRegistry.addActor(
            playerToAdd
          );
          console.log("Player added", this.common.actorRegistry.getActorsByType(playerToAdd.constructor.name));
          if(playerToAdd.getNumber() === "1") {
            this.common.ballCarrier.clearPlayerState();
            this.common.ballCarrier.setCarrier(playerToAdd);
          }
        } else {
          const startX = this.draggedActor instanceof Player ? this.draggedActor.getX() : worldCoords.x;
          const startY = this.draggedActor instanceof Player ? this.draggedActor.getY() : worldCoords.y;
          this.draggedMouseCoordinates = new CoordinateRecorder({x: startX, y: startY});
  
          // Not sure if using these coords matters in practice or not but we can fix this if players are starting at the wrong spots
          this.draggedMouseCoordinates.startRecording(this.clock.getClock());
          //this.common.scene.setReplayState("record");
          this.draggedActor = this.hoveredActor;
  
          // We need to reset the positions AND movement paths of all players here
          this.clock.reset(true);
          // TODO: Actually, lets not reset unless the target player has never been moved
          
          // And reset the target path of the dragged player (because we're about to create a new one!)
          if(this.draggedActor instanceof Player) {
            this.draggedActor.resetTargetPath();
          }
          this.clock.record();
        }
      }
      this.mouseDown = null;

    }

    if(this.mouseUp != null) {
      if(this.mouseUp.button === 2) {
        console.log("Right-click up detected");   
      } else if(this.mouseUp.button === 0) {
        console.log("Left-click up detected");
        if(this.draggedActor != null) {
          if (this.draggedActor instanceof Player) {
            this.draggedActor.setTargetPath(this.draggedMouseCoordinates);
          }
          this.draggedMouseCoordinates = null;
          this.draggedActor = null;
          this.clock.stop();
    
          // We need to reset only the positions of the players (but keep the paths!)
          this.clock.reset(false);
        }
      }
      this.mouseUp = null;
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

    if (this.bufferTranslation) {
      this.collider.setTranslation(this.bufferTranslation);
      this.x = this.bufferTranslation.x;
      this.y = this.bufferTranslation.y;
    }
    // Just get the top actor
    this.hoveredActor = null;
    for (let collision of collisions) {
      const actor = this.common.actorRegistry.getActor(collision);
      if(actor == null || actor instanceof Football) { 
        // Footballs not selectable
        // FIXME: selectability really should be defined in each actor class
        continue;
      }
      this.hoveredActor = this.common.actorRegistry.getActor(collision);
      break;
    }
  }
}
