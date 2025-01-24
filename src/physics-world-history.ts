

import { World } from "@dimforge/rapier2d";
import createRBTree, { Tree } from "functional-red-black-tree";

export class PhysicsWorldHistory {

  private worldSnapshots: Tree<number, Uint8Array> = createRBTree();

  constructor(initialWorld: World) {
    this.worldSnapshots = this.worldSnapshots.insert(0, initialWorld.takeSnapshot());
  }

  addPhysicsAtTime(time: number, world: World) {
    // Remove all snapshots after this time
    let iterator = this.worldSnapshots.gt(time);
    while (iterator.valid) {
      if(iterator.key != null) {
        this.worldSnapshots = this.worldSnapshots.remove(iterator.key);
      }
      iterator.next();
    }

    this.worldSnapshots = this.worldSnapshots.insert(time, world.takeSnapshot());
  }

  getPhysicsAtTime(time: number): World {
    const iterator = this.worldSnapshots.le(time);
    if (iterator.value == null) {
      // First world should never be null since we provide an initial value in the constructor
      return World.restoreSnapshot(this.worldSnapshots.begin.value as Uint8Array); 
    }
    return World.restoreSnapshot(iterator.value);
  }

}
