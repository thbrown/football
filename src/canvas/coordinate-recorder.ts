import createRBTree, { Tree } from "functional-red-black-tree";
import { Coordinate } from "../utils/types";
import { Clock } from "../clock";

class CoordinateRecorder {
  private clock: Clock;
  private coordinates: Tree<number, Coordinate>;

  constructor(initialCoordinate: Coordinate) {
    this.coordinates = createRBTree();
    this.coordinates = this.coordinates.insert(0, initialCoordinate);
  }

  startRecording(clock : Clock): void {
    this.clock = clock;
    const previousStartingX = this.coordinates.begin.value.x;
    const previousStartingY = this.coordinates.begin.value.y;
    this.coordinates = createRBTree(); // Reset the tree
    this.coordinates = this.coordinates.insert(0, {x: previousStartingX, y: previousStartingY});
  }

  isRecording(): boolean {
    return this.clock != null;
  }

  setPoint(coord: Coordinate): void {
    if (this.clock == null) {
      throw new Error("Recording has not started. Call startRecording first.");
    }
    this.coordinates = this.coordinates.insert(this.clock.getElapsedTime(), coord);
  }

  stopRecording(): void {
    this.clock = null;
  }

  getCoordAtTime(t: number): Coordinate | null {
    const iterator = this.coordinates.le(t);
    if (iterator.value == null) {
      return this.coordinates.end.value;
    }

    return iterator.value;
  }

  drawPath(
    ctx: CanvasRenderingContext2D,
    mapCoords: (coord: Coordinate) => Coordinate,
    color: string,
    timestamp?: number,
  ): void {
    if (this.coordinates.length === 0) {
      return;
    }

    const iterator = this.coordinates.begin;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    let first = true;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;

    while (iterator.valid) {
      const time = iterator.key;
      const coord = mapCoords(iterator.value);

      if (timestamp != undefined && time > timestamp) {
        break;
      }

      if (first) {
        ctx.moveTo(coord.x, coord.y);
        first = false;
      } else {
        ctx.lineTo(coord.x, coord.y);
      }

      iterator.next();
    }

    ctx.stroke();
  }
}

export default CoordinateRecorder;
