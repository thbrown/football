import {
  Collider,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { ActorCommon, Coordinate, Rapier } from "../utils/types";
import { Actor } from "./actor";
import { Mouse } from "./mouse";
import CoordinateRecorder from "./coordinate-recordet";
import { Clock } from "./clock";
import { Kinematics } from "../utils/kinematics";
import { PLAYER_ACCELERATION, PLAYER_MAX_SPEED } from "../utils/constants";
import { getDist } from "../utils/generic-utils";

export class Player extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private initialX: number;
  private initialY: number;
  private rigidBody: RigidBody;
  private common: ActorCommon;
  private selected: boolean;
  private targetPath: CoordinateRecorder | null;
  private travledPath: CoordinateRecorder | null;
  private clock: Clock;
  private recordingMotion: boolean;

  constructor({
    common,
    clock,
    x,
    y,
    radius,
  }: {
    common: ActorCommon;
    clock: Clock;
    x: number;
    y: number;
    radius: number;
  }) {
    const rigidBodyDesc = common.rapier.RigidBodyDesc.dynamic().setTranslation(
      x,
      y
    );
    const rigidBody = common.world.createRigidBody(rigidBodyDesc);
    const colliderDesc = common.rapier.ColliderDesc.ball(radius);
    const collider = common.world.createCollider(colliderDesc, rigidBody);
    super(common, collider.handle);

    this.common = common;
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;
    this.radius = radius;
    this.rigidBody = rigidBody;
    this.selected = true;
    this.recordingMotion = false;
    this.clock = clock;
    this.clock.setResetListener(() => {
      this.travledPath = null;
    });
  }

  setTargetPath(value: CoordinateRecorder): void {
    this.targetPath = value;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Draw paths first (so the player circle appears on top of them)
    if (this.targetPath != null) {
      this.targetPath.drawPath(
        ctx,
        (coord: Coordinate) => {
          return camera.toScreenCoord(coord.x, coord.y);
        },
        "white",
        this.clock.getTimeElapsed(),
      );
    }

    if(this.travledPath != null) {
      this.travledPath.drawPath(
        ctx,
        (coord: Coordinate) => {
          return camera.toScreenCoord(coord.x, coord.y);
        },
        "yellow",
        //this.clock.getTimeElapsed()
      );
    }

    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();
    const screenRadius = this.radius * screenScale;

    // Draw the ball
    ctx.beginPath();
    ctx.arc(screenCoords.x, screenCoords.y, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.selected === true ? "red" : "blue";
    ctx.fill();
    ctx.closePath();
  }

  update(collisions: number[]): void {
    // Update draw location based on the physics engine
    const position = this.rigidBody.translation();
    this.x = position.x;
    this.y = position.y;

    // Check if the player is selected (colliding mouse pointer)
    this.selected = false;
    for (let collision of collisions) {
      const target = this.common.actorRegistry.get(collision);
      if (target instanceof Mouse) {
        this.selected = true;
      }
    }

    // Record path traveled (if clock is running)
    if (this.targetPath != null && this.clock.getTimeElapsed() > 0) {
      if (this.travledPath == null) {
        this.travledPath = new CoordinateRecorder({ x: this.initialX, y: this.initialY });
        this.travledPath.startRecording(this.targetPath.getStartTime());
      }
      this.travledPath.setPoint({ x: this.x, y: this.y });
    }

    // Move toward the target path
    if (this.targetPath != null && this.clock.getTimeElapsed() > 0) {
      const targetPosition = this.targetPath.getCoordAtTime(
        this.clock.getTimeElapsed()
      ) ?? { x: this.initialX, y: this.initialY };

      const newLinearVelocity = this.calcLinearVelocity(
        this.rigidBody.translation(),
        targetPosition,
        this.rigidBody.linvel()
      );

      // Deadzone, so we don't get jiggling players at the end of the route
      if(getDist(this.rigidBody.translation(), targetPosition) < 0.1) {
        this.rigidBody.setLinvel({ x: 0, y: 0 }, true);
      } else {
        this.rigidBody.setLinvel(newLinearVelocity, true);
      }
    } else {
      this.rigidBody.setTranslation(
        { x: this.initialX, y: this.initialY },
        true
      );
    }
  }

  private calcLinearVelocity(
    currentPosition: Coordinate,
    targetPosition: Coordinate,
    currentVelocity: Coordinate
  ): Coordinate {
    const xDistToCoord = currentPosition.x - targetPosition.x;
    const yDistToCoord = currentPosition.y - targetPosition.y;

    // Run as fast as possible to the target
    const xVelocity1 =
      Kinematics.getFinalVelocity(
        currentVelocity.x,
        PLAYER_ACCELERATION,
        Math.abs(xDistToCoord)
      ) * (xDistToCoord < 0 ? 1 : -1);
    const yVelocity1 =
      Kinematics.getFinalVelocity(
        currentVelocity.y,
        PLAYER_ACCELERATION,
        Math.abs(yDistToCoord)
      ) * (yDistToCoord < 0 ? 1 : -1);

    // We need to move more slowly if we are close to the target, otherwise we will overshoot
    const xVelocity2 =
      Kinematics.getInitialVelocity(
        0,
        -PLAYER_ACCELERATION,
        Math.abs(xDistToCoord)
      ) * (xDistToCoord < 0 ? 1 : -1);
    const yVelocity2 =
      Kinematics.getInitialVelocity(
        0,
        -PLAYER_ACCELERATION,
        Math.abs(yDistToCoord)
      ) * (yDistToCoord < 0 ? 1 : -1);

    // Choose the slower of the two velocities
    let xVelocity = Math.min(xVelocity1, xVelocity2);
    let yVelocity = Math.min(yVelocity1, yVelocity2);

    // Limit to max speed
    const speed = Math.sqrt(xVelocity * xVelocity + yVelocity * yVelocity);
    if (speed > PLAYER_MAX_SPEED) {
      const ratio = PLAYER_MAX_SPEED / speed;
      xVelocity *= ratio;
      yVelocity *= ratio;
    }

    return { x: xVelocity, y: yVelocity };
  }
}
