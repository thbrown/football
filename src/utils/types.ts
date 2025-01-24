import { EventQueue, World } from "@dimforge/rapier2d";
import { Actor } from "../canvas/actor";
import { MakePlay } from "../make-play";
import { ActorRegistry } from "../canvas/actor-registry";
import { PhysicsWorldHistory } from "../physics-world-history";
import { BallCarrier } from "../canvas/ball-carrier";

export type Rapier = typeof import("@dimforge/rapier2d");
export type ActorCommon = {
  rapier: Rapier;
  world: World;
  eventQueue: EventQueue;
  actorRegistry: ActorRegistry;
  scene: MakePlay;
  physicsWorldHistory: PhysicsWorldHistory;
  ballCarrier: BallCarrier;
};

export type ReplayState = "record" | "replay";

export interface Coordinate {
  x: number;
  y: number;
}
