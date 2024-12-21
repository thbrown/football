import { EventQueue, World } from "@dimforge/rapier2d";
import { Actor } from "../canvas/actor";

export type Rapier = typeof import("@dimforge/rapier2d");
export type ActorRegistry = Map<number, Actor>;
export type ActorCommon = {
  rapier: Rapier;
  world: World;
  eventQueue: EventQueue;
  actorRegistry: ActorRegistry;
};

export interface Coordinate {
  x: number;
  y: number;
}
