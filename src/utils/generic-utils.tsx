import { v4 as uuidv4 } from "uuid";
import { Coordinate } from "./types";

export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};

export const getDist = (a: Coordinate, b: Coordinate): number => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}