import { Camera } from "./camera";
import { Coordinate } from "../utils/types";
import { ActorCommon } from "./actor-common";
import { Actor } from "./actor";
import { Player } from "./player";
import { ClockActor } from "./clock-actor";
import CoordinateRecorder from "./coordinate-recorder";
import { LEFT_CLICK, PLAYER_RADIUS, RIGHT_CLICK } from "../utils/constants";
import { Football } from "./football";

export class Mouse extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private bufferTranslation: { x: number; y: number };
  private clock: ClockActor;
  private canvas: HTMLCanvasElement;
  private camera: Camera;

  private hoveredActor: Actor | null;
  private draggedActor: Actor | null;
  private draggedMouseCoordinates: CoordinateRecorder;

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
    super(common, null, collider.handle);
    this.x = -9999999;
    this.y = -9999999;
    this.radius = radius;
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

  draw(common: ActorCommon, ctx: CanvasRenderingContext2D, camera: Camera): void {
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

  update(common: ActorCommon, collisions: number[]): void {
    if(this.mouseDown != null) {
      if(this.mouseDown.button === RIGHT_CLICK) {
        console.log("Right-click down detected");
        if(this.hoveredActor instanceof Player) {
          this.hoveredActor.deleteDescendants();
          common.actorRegistry.removeActor(this.hoveredActor);
          // Remove footbal for player 0 too
        }
        this.clock.reset(common, true);
      } else if(this.mouseDown.button === LEFT_CLICK) {
        console.log("Left-click down detected");
        const event = this.mouseDown;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const worldCoords = this.camera.toWorldCoord(canvasX, canvasY);
        if (this.hoveredActor == null) {
          const playerToAdd = new Player({
            common: common,
            clock: this.clock,
            x: worldCoords.x,
            y: worldCoords.y,
            radius: PLAYER_RADIUS,
          });
          common.actorRegistry.addActor(
            playerToAdd
          );
          if(playerToAdd.getNumber() === "1") {
            common.ballCarrier.clearPlayerState();
            common.ballCarrier.setCarrier(common, playerToAdd);
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
          this.clock.reset(common, true);
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
          this.clock.reset(common, false);
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
        this.draggedMouseCoordinates.recordPoint(worldCoords);
      }
      if (this.draggedActor instanceof Player) {
        this.draggedActor.setTargetPath(this.draggedMouseCoordinates);
      }
      this.mouseMove = null;
    } 

    if (this.bufferTranslation) {
      common.world.getCollider(this.getColliderHandle()).setTranslation(this.bufferTranslation);
      this.x = this.bufferTranslation.x;
      this.y = this.bufferTranslation.y;
    }

    // Just get the top actor
    this.hoveredActor = null;
    for (let collision of collisions) {
      const actor = common.actorRegistry.getActorByColliderHandle(collision);
      if(actor == null || actor instanceof Football) { 
        // Footballs are not selectable
        // FIXME: selectability should be defined in each actor class
        continue;
      }
      this.hoveredActor = actor;
      break;
    }
  }
}
