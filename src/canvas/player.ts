import {
  Collider,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { Coordinate, Rapier } from "../utils/types";
import { ActorCommon } from "./actor-common";
import { Actor } from "./actor";
import { Mouse } from "./mouse";
import CoordinateRecorder from "./coordinate-recorder";
import { ClockActor } from "./clock-actor";
import { Kinematics } from "../utils/kinematics";
import { MAGIC_VELOCITY_CONSTANT, PLAYER_ACCELERATION, PLAYER_DECELERATION, PLAYER_MAX_SPEED } from "../utils/constants";
import { getDist } from "../utils/generic-utils";
import { ActorRegistry } from "./actor-registry";

export class Player extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private initialX: number;
  private initialY: number;
  private rigidBody: RigidBody;
  private common: ActorCommon;
  private selected: boolean;
  private targetPath: CoordinateRecorder;
  private travledPath: CoordinateRecorder;
  private clock: ClockActor;
  private playerNumber: string;
  private isMoved: boolean = false;

  constructor({
    common,
    clock,
    x,
    y,
    radius,
  }: {
    common: ActorCommon;
    clock: ClockActor;
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
    this.clock = clock;
    this.clock.setResetListener((hardReset) => {
      this.resetPosition(hardReset);
    });
    this.targetPath = new CoordinateRecorder({ x, y });
    this.travledPath = new CoordinateRecorder({ x, y });
    this.playerNumber = this.getPlayerNumber(common.actorRegistry);
  }

  private getPlayerNumber(registry: ActorRegistry): string {
    const players = registry.getActorsByType(Player.name) as Player[];
    const takenNumbers = new Set(players.map(player => player.playerNumber));
    let playerNumber = 1;
    while (takenNumbers.has(playerNumber.toString())) {
      playerNumber++;
    }
    return playerNumber.toString();
  }

  resetTargetPath(): void {
    this.targetPath = new CoordinateRecorder({ x: this.initialX, y: this.initialY });
  }

  resetPosition(hardReset: boolean): void {
    this.x = this.initialX;
    this.y = this.initialY;
    this.rigidBody.setTranslation(
      { x: this.initialX, y: this.initialY },
      true
    );
    this.rigidBody.setLinvel({ x: 0, y: 0 }, true);
    if (hardReset) {
      this.travledPath = new CoordinateRecorder({ x: this.initialX, y: this.initialY });
    }
  }

  setTargetPath(value: CoordinateRecorder): void {
    this.targetPath = value;
    this.isMoved = true;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Draw paths first (so the player circle appears on top of them)
    /*
    if (this.targetPath != null) {
      this.targetPath.drawPath(
        ctx,
        (coord: Coordinate) => {
          return camera.toScreenCoord(coord.x, coord.y);
        },
        "white",
        this.clock.getElapsedTime(),
      );
    }*/

    // Draw target
    if (this.targetPath != null) {
      const targetPosition = this.targetPath.getCoordAtTime(
        this.clock.getElapsedTime()
      ) ?? { x: this.initialX, y: this.initialY };

      const screenTargetCoords = camera.toScreenCoord(targetPosition.x, targetPosition.y);
      ctx.beginPath();
      ctx.arc(screenTargetCoords.x, screenTargetCoords.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();
      if(this.isMoved && this.clock.getElapsedTime() > 0) {
        ctx.fillText(this.getNumber(), screenTargetCoords.x, screenTargetCoords.y - 20);
      }
    }

    if (this.travledPath != null) {
      this.travledPath.drawPath(
        ctx,
        (coord: Coordinate) => {
          return camera.toScreenCoord(coord.x, coord.y);
        },
        "yellow",
        this.clock.getElapsedTime()
      );
    }

    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();
    const screenRadius = this.radius * screenScale;

    // Draw the player circle
    ctx.beginPath();
    ctx.arc(screenCoords.x, screenCoords.y, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.selected === true ? "red" : "blue";
    ctx.fill();
    ctx.closePath();

    // Draw the player number
    ctx.fillStyle = "white";
    //ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.playerNumber, screenCoords.x, screenCoords.y);
    
  }

  update(collisions: number[]): void {
    // Check if the player is selected (colliding mouse pointer)
    this.selected = false;
    for (let collision of collisions) {
      const target = this.common.actorRegistry.getActor(collision);
      if (target instanceof Mouse) {
        this.selected = true;
      }
    }

    if (this.clock.getClock().getIsRecording()) {
      // Update draw location based on the physics engine
      const position = this.rigidBody.translation();
      this.x = position.x;
      this.y = position.y;

      if (!this.travledPath.isRecording()) {
        this.travledPath.startRecording(this.clock.getClock());
      }
      this.travledPath.setPoint({ x: this.x, y: this.y });

      // Set the velocity of the player to move towards the target
      if (this.targetPath != null && this.clock.getElapsedTime() > 0) {
        const targetPosition = this.targetPath.getCoordAtTime(
          this.clock.getElapsedTime()
        ) ?? { x: this.initialX, y: this.initialY };

        const newLinearVelocity = this.calcLinearVelocity(
          this.rigidBody.translation(),
          targetPosition,
          this.rigidBody.linvel()
        );

        // Deadzone, so we don't get jiggling players at the end of the route
        if (getDist(this.rigidBody.translation(), targetPosition) < 0.1) {
          this.rigidBody.setLinvel({ x: 0, y: 0 }, true);
        } else {
          this.rigidBody.setLinvel({x: newLinearVelocity.x/MAGIC_VELOCITY_CONSTANT, y: newLinearVelocity.y/MAGIC_VELOCITY_CONSTANT}, true);
        }
      }
    } else {
      const position = this.travledPath.getCoordAtTime(this.clock.getElapsedTime());
      this.x = position.x;
      this.y = position.y;
      // We need to move the ridgid body too because we rely on it's position for collision detection
      this.rigidBody.setTranslation(
        { x: this.x, y: this.y },
        true
      );
    }
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getNumber(): string {
    return this.playerNumber;
  }

  getDepth(): number {
    return 1;
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
      Kinematics.getFinalVelocity2(
        currentVelocity.x,
        PLAYER_ACCELERATION,
        Math.abs(xDistToCoord)
      ) * (xDistToCoord < 0 ? 1 : -1);
    const yVelocity1 =
      Kinematics.getFinalVelocity2(
        currentVelocity.y,
        PLAYER_ACCELERATION,
        Math.abs(yDistToCoord)
      ) * (yDistToCoord < 0 ? 1 : -1);

    // We need to move more slowly if we are close to the target, otherwise we will overshoot
    // TODO: this should use magnitured not independent direction
    const xVelocity2 =
      Kinematics.getInitialVelocity(
        0,
        -PLAYER_DECELERATION,
        Math.abs(xDistToCoord)
      ) * (xDistToCoord < 0 ? 1 : -1);
    const yVelocity2 =
      Kinematics.getInitialVelocity(
        0,
        -PLAYER_DECELERATION,
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
