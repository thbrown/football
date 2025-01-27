import { EventQueue, World } from "@dimforge/rapier2d";
import { Actor } from "../canvas/actor";
import { MakePlay } from "../make-play";
import { ActorRegistry } from "../canvas/actor-registry";
import { PhysicsWorldHistory } from "../physics-world-history";
import { BallCarrier } from "../canvas/ball-carrier";

export type Rapier = typeof import("@dimforge/rapier2d");

export type ReplayState = "record" | "replay";

export interface Coordinate {
  x: number;
  y: number;
}
