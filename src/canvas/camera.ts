import { FIELD_WIDTH } from "../utils/constants";

export class Camera {
  private canvasWidth: number;
  private canvasHeight: number;
  private offsetX: number;
  private offsetY: number;
  private zoom: number;

  private scaleFactor: number;

  constructor(
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    offsetX: number = 0,
    offsetY: number = 0,
    zoom: number = FIELD_WIDTH // FEET ON WIDTH
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.zoom = zoom;

    // i.e. 1 foot in world coordinates is equal to this many pixels on the screen
    this.scaleFactor = this.canvasWidth / this.zoom;
  }

  /**
   * Maps world coordinates to screen coordinates.
   */
  toScreenCoord(x: number, y: number): { x: number; y: number } {
    const screenX =
      (x - this.offsetX) * this.scaleFactor + this.canvasWidth / 2;
    const screenY =
      (this.offsetY - y) * this.scaleFactor + this.canvasHeight / 2;
    return { x: screenX, y: screenY };
  }

  /**
   * Maps screen coordinates to world coordinates.
   */
  toWorldCoord(x: number, y: number): { x: number; y: number } {
    const worldX = (x - this.canvasWidth / 2) / this.scaleFactor + this.offsetX;
    const worldY =
      this.offsetY - (y - this.canvasHeight / 2) / this.scaleFactor;
    return { x: worldX, y: worldY };
  }

  /**
   * Sets the offsets.
   */
  setOffsets(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  /**
   * Sets the zoom level.
   */
  setZoom(zoom: number): void {
    //if (zoom <= 0) {
    //  throw new Error("Zoom level must be greater than zero.");
    //}
    this.zoom = zoom;
  }

  /**
   * Sets the canvas dimensions.
   */
  setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.scaleFactor = this.canvasWidth / this.zoom;
  }

  getScaleFactor(): number {
    return this.scaleFactor;
  }
}
