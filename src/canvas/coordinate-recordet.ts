import createRBTree, { Tree } from "functional-red-black-tree";
import { Coordinate } from "../utils/types";

class CoordinateRecorder {
  private startTime: number | null = null;
  private coordinates: Tree<number, Coordinate>;

  constructor(initialCoordinate: Coordinate) {
    this.coordinates = createRBTree();
    this.coordinates.insert(0, initialCoordinate);
  }

  startRecording(startTime? : number): void {
    this.startTime = startTime ?? performance.now();
    this.coordinates = createRBTree(); // Reset the tree
  }

  setPoint(coord: Coordinate): void {
    if (this.startTime === null) {
      throw new Error("Recording has not started. Call startRecording first.");
    }
    const timestamp = performance.now() - this.startTime;
    this.coordinates = this.coordinates.insert(timestamp, coord);
    //console.log(
    //  `Recording point at ${timestamp} ms: (${coord.x}, ${coord.y}) ${this.coordinates.length}`
    //);
  }

  getStartTime(): number | null {
    return this.startTime;
  }

  stopRecording(): void {
    this.startTime = null;
  }

  getCoordAtTime(t: number): Coordinate | null {
    // Should not happen now that we supply an initial coord
    //if (this.coordinates.length === 0) {
    //  return null; 
    //}

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

    //console.log("Drawing up to", timestamp);

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

      //ctx.beginPath();
      //ctx.arc(coord.x, coord.y, 10, 0, Math.PI * 2);
      //ctx.fillStyle = "yellow";
      //ctx.fill();
      //ctx.closePath();
      iterator.next();
    }

    ctx.stroke();
  }
}

export default CoordinateRecorder;
