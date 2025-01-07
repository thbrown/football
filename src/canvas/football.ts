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
import { FOOTBALL_HEIGHT, FOOTBALL_WIDTH, PLAYER_ACCELERATION, PLAYER_DECELERATION, PLAYER_MAX_SPEED } from "../utils/constants";
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
  private controllingPlayer: Player;
  private initialControllingPlayer: Player;
  private clock: ClockActor;

  constructor({
    common,
    clock,
    x,
    y,
    controllingPlayer
  }: {
    common: ActorCommon;
    clock: ClockActor;
    x: number;
    y: number;
    controllingPlayer: Player;
  }) {
    const rigidBodyDesc = common.rapier.RigidBodyDesc.dynamic().setTranslation(
      x,
      y
    );
    const rigidBody = common.world.createRigidBody(rigidBodyDesc);
    const colliderDesc = common.rapier.ColliderDesc.ball(FOOTBALL_WIDTH);
    const collider = common.world.createCollider(colliderDesc, rigidBody);
    super(common, collider.handle);

    this.common = common;
    this.x = x;
    this.y = y;
    this.rigidBody = rigidBody;
    this.controllingPlayer = controllingPlayer;
    this.initialControllingPlayer = controllingPlayer;
    this.clock = clock;
    this.clock.setResetListener((_hardReset) => {
      this.resetPosition();
    });
    this.height = 0;
  }

  resetPosition(): void {
    const initialX = this.initialControllingPlayer.getX();
    const initialY = this.initialControllingPlayer.getY();
    this.x = initialX;
    this.y = initialY;
    this.height = 0;
    this.rigidBody.setTranslation(
      { x: initialX, y: initialY },
      true
    );
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // Get screen coords
    const screenCoords = camera.toScreenCoord(this.x, this.y);
    const screenScale = camera.getScaleFactor();

    // Football dimensions
    const centerX = screenCoords.x; // Center of the canvas
    const centerY = screenCoords.y;
    const radiusX = FOOTBALL_WIDTH * screenScale; // Horizontal radius (half of the width)
    const radiusY = FOOTBALL_HEIGHT * screenScale;  // Vertical radius (half of the height)
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
    ctx.lineWidth = .1*screenScale;
    const laceStartX = centerX - radiusX / 3;
    const laceEndX = centerX + radiusX / 3;
    for (let i = 0; i <= 4; i++) {
      const laceY = centerY - radiusY / 4 + (i * radiusY / 8);
      ctx.beginPath();
      ctx.moveTo(laceStartX, laceY);
      ctx.lineTo(laceEndX, laceY);
      ctx.stroke();
    }
  }

  update(collisions: number[]): void {
    this.x = this.controllingPlayer.getX();
    this.y = this.controllingPlayer.getY();
    /*
    // Check if the player is selected (colliding mouse pointer)
    this.selected = false;
    for (let collision of collisions) {
      const target = this.common.actorRegistry.get(collision);
      if (target instanceof Mouse) {
        this.selected = true;
      }
    }

    const replayState = this.common.scene.getReplayState();
    if(replayState === "record") {
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
        if(getDist(this.rigidBody.translation(), targetPosition) < 0.1) {
          this.rigidBody.setLinvel({ x: 0, y: 0 }, true);
        } else {
          this.rigidBody.setLinvel(newLinearVelocity, true);
        }
      } 
    } else if(replayState === "replay") {
      const position = this.travledPath.getCoordAtTime(this.clock.getElapsedTime());
      this.x = position.x;
      this.y = position.y;
      // We need to move the ridgid body too because we rely on it's position for collision detection
      this.rigidBody.setTranslation(
        { x: this.x, y: this.y },
        true
      );
    }
      */
  }
}
