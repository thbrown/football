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
import CoordinateRecorder from "./coordinate-recorder";
import { ClockActor } from "./clock-actor";
import { Kinematics } from "../utils/kinematics";
import { FOOTBALL_HEIGHT, FOOTBALL_SPEED, FOOTBALL_WIDTH, PLAYER_ACCELERATION, PLAYER_DECELERATION, PLAYER_MAX_SPEED, MAGIC_VELOCITY_CONSTANT } from "../utils/constants";
import { getDist } from "../utils/generic-utils";
import { Clock } from "../clock";
import { Player } from "./player";

export class Football extends Actor {
  private radius: number;
  private x: number;
  private y: number;
  private height: number;
  private rigidBody: RigidBody;
  private common: ActorCommon;
  private clock: ClockActor;
  private throwStartTimestamp: number;
  private verticalVelocity: number;
  private travledPath: CoordinateRecorder;

  constructor({
    common,
    clock,
    x,
    y,
  }: {
    common: ActorCommon;
    clock: ClockActor;
    x: number;
    y: number;
  }) {
    const rigidBodyDesc = common.rapier.RigidBodyDesc.dynamic().setTranslation(
      x,
      y
    );
    const rigidBody = common.world.createRigidBody(rigidBodyDesc);
    const colliderDesc = common.rapier.ColliderDesc.ball(FOOTBALL_WIDTH);
    const collider = common.world.createCollider(colliderDesc, rigidBody);
    collider.setSensor(true);
    super(common, collider.handle);

    this.common = common;
    this.x = x;
    this.y = y;
    this.rigidBody = rigidBody;
    this.clock = clock;
    this.clock.setResetListener((hardReset) => {
      this.resetPosition(hardReset);
    });
    this.height = 0;
    this.travledPath = new CoordinateRecorder({ x, y });
  }

  resetPosition(hardReset: boolean): void {
    const initialX = this.common.ballCarrier.getInitialPlayer().getX();
    const initialY = this.common.ballCarrier.getInitialPlayer().getY();
    this.x = initialX;
    this.y = initialY;
    this.common.ballCarrier.reset();
    this.height = 0;
    this.rigidBody.setTranslation(
      { x: initialX, y: initialY },
      true
    );
    if(hardReset) {
      this.travledPath = new CoordinateRecorder({ x: initialX, y: initialY });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if(this.common.ballCarrier.getInitialPlayer() == null) {
      return;
    }

    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();
    const heightScale = 1 + 1 * (this.height / 5);

    // Football dimensions
    const centerX = screenCoords.x; // Center of the canvas
    const centerY = screenCoords.y;
    const radiusX = FOOTBALL_WIDTH * screenScale * heightScale; // Horizontal radius (half of the width)
    const radiusY = FOOTBALL_HEIGHT * screenScale * heightScale;  // Vertical radius (half of the height)
    const rotation = 0;  // Rotation in radians
    const startAngle = 0; // Starting angle of the ellipse
    const endAngle = 2 * Math.PI; // Ending angle of the ellipse

    // Draw the football shape (ellipse)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle);
    ctx.fillStyle = 'brown'; // Football color
    ctx.fill();
    ctx.strokeStyle = 'white'; // Outline color
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw laces (optional)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = .1 * screenScale * heightScale;
    const laceStartX = centerX - radiusX / 3;
    const laceEndX = centerX + radiusX / 3;
    for (let i = 0; i <= 4; i++) {
      const laceY = centerY - radiusY / 4 + (i * radiusY / 8);
      ctx.beginPath();
      ctx.moveTo(laceStartX, laceY);
      ctx.lineTo(laceEndX, laceY);
      ctx.stroke();
    }

    // Draw traveled path
    if (this.travledPath != null) {
      this.travledPath.drawPath(
        ctx,
        (coord: Coordinate) => {
          return camera.toScreenCoord(coord.x, coord.y);
        },
        "orange",
        this.clock.getElapsedTime()
      );
    }
  }

  update(collisions: number[], pressedKeys: Set<String>): void {
    // The code here implies that the football is throwing itself, but it would be more representitive (and therefore more extensible) if the player throws the football
    if (this.clock.getClock().getIsRecording()) {
      for (let collision of collisions) {
        if (this.common.ballCarrier.getPlayer() != null) {
          break;
        }
        const target = this.common.actorRegistry.getActor(collision);
        // Can't pass a ball to yourself for now
        if (target instanceof Player && target != this.common.ballCarrier.getMostRecentPlayer()) {
          this.common.ballCarrier.setCarrier(target);
          //this.controllingPlayer = target;
          //this.mostRecentControllingPlayer = target;
          break;
        }
      }

      pressedKeys.forEach((key) => {
        this.common.actorRegistry.getActorsByType(Player.name).forEach((actor) => {
          const player = actor as Player;
          if (player.getNumber() === key) {
            // Throw the football to the player that matches the key
            console.log(`Throwing football to player ${player.getNumber()}`);

            // const playerPosition = {x: player.getX(), y: player.getY()};
            const playerPosition = getEstimatedPlayerPosition(player, this.common.physicsWorldHistory.getPhysicsAtTime(this.clock.getClock().getElapsedTime()));

            // Calculate the ball's launch angle based on distance between the player and the football and the player's throwing power
            const distance = Math.sqrt(
              Math.pow(playerPosition.x - this.x, 2) +
              Math.pow(playerPosition.y - this.y, 2)
            );
            const launchAngle = Kinematics.calcMinLaunchAngle(distance, FOOTBALL_SPEED);

            console.log(`Launch angle: ${launchAngle * (180 / Math.PI)} degrees`);
            const horizontalVelocity = Math.cos(launchAngle) * FOOTBALL_SPEED;
            this.verticalVelocity = Math.sin(launchAngle) * FOOTBALL_SPEED;

            console.log("Velocity (V,H): ", this.verticalVelocity, horizontalVelocity);

            const xDiff = player.getX() - this.x;
            const yDiff = player.getY() - this.y;
            const angle = Math.atan2(yDiff, xDiff);
            this.rigidBody.setLinvel({
              x: horizontalVelocity * Math.cos(angle) / MAGIC_VELOCITY_CONSTANT,
              y: horizontalVelocity * Math.sin(angle) / MAGIC_VELOCITY_CONSTANT
            }, true);
            this.common.ballCarrier.setCarrier(null);
            this.throwStartTimestamp = this.clock.getClock().getElapsedTime();
            return;
          }
        });
      });

      if (this.common.ballCarrier.getPlayer() == null) {
        this.x = this.rigidBody.translation().x;
        this.y = this.rigidBody.translation().y;
        const msSinceBallWasThrown = this.clock.getClock().getElapsedTime() - this.throwStartTimestamp;
        this.height = Math.max(Kinematics.calcHeight(0, this.verticalVelocity, msSinceBallWasThrown/1000), 0);
      } else {
        this.x = this.common.ballCarrier.getPlayer().getX();
        this.y = this.common.ballCarrier.getPlayer().getY();
        this.rigidBody.setTranslation(
          { x: this.x, y: this.y },
          true
        );
        this.height = 0;
      }

      if (!this.travledPath.isRecording()) {
        this.travledPath.startRecording(this.clock.getClock());
      }
      this.travledPath.setPoint({ x: this.x, y: this.y });
    } else {
      const position = this.travledPath.getCoordAtTime(this.clock.getElapsedTime());
      this.x = position.x;
      this.y = position.y;
      this.rigidBody.setTranslation(
        { x: this.x, y: this.y },
        true
      );
    }
  }

  getDepth(): number {
    return 2;
  }
  
}

function getEstimatedPlayerPosition(player: Player, world: World) {
  return { x: player.getX(), y: player.getY() };
}

