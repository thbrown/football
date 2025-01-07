import {
  ColliderDesc,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d";
import { ActorCommon } from "../utils/types";
import { Camera } from "./camera";

export abstract class Actor {
  private handle: number;

  constructor(common: ActorCommon, rapierHandle?: number) {
    const handle =
      rapierHandle == null
        ? Actor.createDummyHandle(common.world)
        : rapierHandle;
    this.handle = handle;
    common.actorRegistry.addActor(this);
  }

  abstract update(collisions: number[]): void;
  abstract draw(ctx: CanvasRenderingContext2D, camera: Camera): void;
  public getHandle(): number {
    return this.handle;
  }

  private static createDummyHandle(world: World): number {
    // Create a static rigid body descriptor
    const bodyDesc = RigidBodyDesc.newStatic(); // Static bodies don't move or interact
    const body = world.createRigidBody(bodyDesc);

    // Create a sensor collider descriptor
    const colliderDesc = ColliderDesc.ball(0); // A zero-radius collider (effectively a no-op)
    colliderDesc.setSensor(true); // Sensors detect collisions but don't physically interact
    colliderDesc.setActiveEvents(0); // Disable collision and contact events
    world.createCollider(colliderDesc, body);

    return body.handle;
  }
}
