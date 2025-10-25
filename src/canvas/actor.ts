import {
  ColliderDesc,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { Camera } from "./camera";
import { ActorCommon } from "./actor-common";
import { ActorRegistry } from "./actor-registry";

export abstract class Actor {
  private rigidBodyHandle: number;
  private colliderHandle: number | null;

  constructor(common: ActorCommon, rigidBodyHandle?: number, colliderHandle?: number) {
    const rigidBodyHandleToAssign =
      rigidBodyHandle == null
        ? Actor.createDummyHandle(common.world)
        : rigidBodyHandle;
    this.rigidBodyHandle = rigidBodyHandleToAssign;
    this.colliderHandle = colliderHandle ?? null;
  }

  abstract update(common: ActorCommon, collisions: number[], pressedKeys: Set<string>): void;
  abstract draw(common: ActorCommon, ctx: CanvasRenderingContext2D, camera: Camera): void;
  public getRigidBodyHandle(): number {
    return this.rigidBodyHandle;
  }

  public getColliderHandle(): number | null {
    return this.colliderHandle;
  }

  public getDepth(): number {
    return 0;
  }

  public deleteDescendants(): void {
    // No-op
  }

  public clone(_registry: ActorRegistry, _common: ActorCommon): Actor {
    throw new Error("Not implemented");
  }

  private static createDummyHandle(world: World): number {
    // Create a static rigid body descriptor
    const bodyDesc = RigidBodyDesc.fixed(); // Static bodies don't move or interact
    const body = world.createRigidBody(bodyDesc);

    // Create a sensor collider descriptor
    const colliderDesc = ColliderDesc.ball(0); // A zero-radius collider (effectively a no-op)
    colliderDesc.setSensor(true); // Sensors detect collisions but don't physically interact
    colliderDesc.setActiveEvents(0); // Disable collision and contact events
    world.createCollider(colliderDesc, body);

    return body.handle;
  }

}
