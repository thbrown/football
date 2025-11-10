
import { Camera } from "./camera";
import { Coordinate, Rapier } from "../utils/types";
import { Actor } from "./actor";
import CoordinateRecorder from "./coordinate-recorder";
import { ClockActor } from "./clock-actor";
import { Kinematics } from "../utils/kinematics";
import { FOOTBALL_HEIGHT, FOOTBALL_SPEED, FOOTBALL_WIDTH, PLAYER_ACCELERATION, PLAYER_DECELERATION, PLAYER_MAX_SPEED, MAGIC_VELOCITY_CONSTANT } from "../utils/constants";
import { Player } from "./player";
import { ActorCommon } from "./actor-common";
import { ActorRegistry } from "./actor-registry";
import { Clock } from "../clock";

export class Football extends Actor {
  private x: number;
  private y: number;
  private height: number;
  private clock: Clock;
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
    clock: Clock;
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
    super(common, rigidBody.handle, collider.handle);

    this.x = x;
    this.y = y;
    this.clock = clock;
    this.clock.setResetListener((common, hardReset) => {
      this.resetPosition(common, hardReset);
    });
    this.height = 0;
    this.travledPath = new CoordinateRecorder({ x, y });
  }

  resetPosition(common: ActorCommon, hardReset: boolean): void {
    console.log("Resetting football position", common);
    const initialX = common.ballCarrier.getInitialPlayer().getX();
    const initialY = common.ballCarrier.getInitialPlayer().getY();
    this.x = initialX;
    this.y = initialY;
    common.ballCarrier.reset();
    this.height = 0;
    common.world.getRigidBody(this.getRigidBodyHandle()).setTranslation(
      { x: initialX, y: initialY },
      true
    );
    if (hardReset) {
      this.travledPath = new CoordinateRecorder({ x: initialX, y: initialY });
    }
  }

  draw(common: ActorCommon, ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (common.ballCarrier.getInitialPlayer() == null) {
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

  update(common: ActorCommon, collisions: number[], pressedKeys: Set<String>): void {
    // The code here implies that the football is throwing itself, but it would be more representitive (and therefore more extensible) if the player throws the football
    const rigidBody = common.world.getRigidBody(this.getRigidBodyHandle());
    if (this.clock.getIsRecording()) {
      for (let collision of collisions) {
        if (common.ballCarrier.getPlayer() != null) {
          break;
        }
        const target = common.actorRegistry.getActorByColliderHandle(collision);
        // Can't pass a ball to yourself for now
        if (target instanceof Player && target != common.ballCarrier.getMostRecentPlayer()) {
          common.ballCarrier.setCarrier(common, target);
          break;
        }
      }

      pressedKeys.forEach((key) => {
        common.actorRegistry.getActorsByType(Player.name).forEach((actor) => {
          const player = actor as Player;
          if (player.getNumber() === key) {
            // Throw the football to the player that matches the key
            console.log(`Throwing football to player ${player.getNumber()}`);

            const playerPosition = {x: player.getX(), y: player.getY()};
            //const playerPosition = getEstimatedPlayerPosition(player, common);

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
            rigidBody.setLinvel({
              x: horizontalVelocity * Math.cos(angle) / MAGIC_VELOCITY_CONSTANT,
              y: horizontalVelocity * Math.sin(angle) / MAGIC_VELOCITY_CONSTANT
            }, true);
            common.ballCarrier.setCarrier(common, null);
            this.throwStartTimestamp = this.clock.getElapsedTime();
            return;
          }
        });
      });

      if (common.ballCarrier.getPlayer() == null) {
        this.x = rigidBody.translation().x;
        this.y = rigidBody.translation().y;
        const msSinceBallWasThrown = this.clock.getElapsedTime() - this.throwStartTimestamp;
        this.height = Math.max(Kinematics.calcHeight(0, this.verticalVelocity, msSinceBallWasThrown / 1000), 0);
      } else {
        this.x = common.ballCarrier.getPlayer().getX();
        this.y = common.ballCarrier.getPlayer().getY();
        rigidBody.setTranslation(
          { x: this.x, y: this.y },
          true
        );
        this.height = 0;
      }

      if (!this.travledPath.isRecording()) {
        this.travledPath.startRecording(this.clock);
      }
      this.travledPath.recordPoint({ x: this.x, y: this.y });
    } else {
      const position = this.travledPath.getCoordAtTime(this.clock.getElapsedTime());
      this.x = position.x;
      this.y = position.y;
      rigidBody.setTranslation(
        { x: this.x, y: this.y },
        true
      );
    }
  }

  clone(registry: ActorRegistry, common: ActorCommon): Football {
    // Assume we are copying a world with one clock actor
    const clocks = registry.getActorsByType(ClockActor.name);
    const clone = new Football({clock: (clocks[0] as ClockActor).getClock(), common, x: this.x, y: this.y});
    clone.height = this.height;
    clone.throwStartTimestamp = this.throwStartTimestamp;
    clone.verticalVelocity = this.verticalVelocity;
    this.travledPath = this.travledPath.clone();
    return clone;
  }

  getDepth(): number {
    return 2;
  }
}

function getEstimatedPlayerPosition(player: Player, common: ActorCommon) {
  const duplicateUniverse = ActorCommon.takeSnapshot(common);
  const stepFunction = ActorCommon.getStepFunction(duplicateUniverse);

  // Simulate 6 seconds into the future
  const startTime = performance.now();
  for(let i = 0; i < 360; i++) {
    stepFunction(null, null, new Set());
  }
  const endTime = performance.now();
  console.log(`Elapsed time for simulation: ${endTime - startTime} ms`);
  return { x: player.getX(), y: player.getY() };
}

