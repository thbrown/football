export class Kinematics {
  /**
   * Calculates the initial velocity (IV) given the final velocity (FV), acceleration, and distance.
   * Uses the equation: FV² = IV² + 2 * a * d
   * Rearranged to: IV = Math.sqrt(FV² - 2 * a * d)
   *
   * @param finalVelocity - Final velocity (FV)
   * @param acceleration - Acceleration (a)
   * @param distance - Distance traveled (d)
   * @returns Initial velocity (IV)
   */
  static getInitialVelocity(
    finalVelocity: number,
    acceleration: number,
    distance: number
  ): number {
    const discriminant =
      Math.pow(finalVelocity, 2) - 2 * acceleration * distance;
    if (discriminant < 0) {
      throw new Error(
        "Invalid input: discriminant is negative. Check your parameters."
      );
    }
    return Math.sqrt(discriminant);
  }

  /**
   * Calculates the final velocity (FV) given the initial velocity (IV), acceleration, and time.
   * Uses the equation: FV = IV + a * t
   *
   * @param initialVelocity - Initial velocity (IV)
   * @param acceleration - Acceleration (a)
   * @param time - Time (t)
   * @returns Final velocity (FV)
   */
  static getFinalVelocity(
    initialVelocity: number,
    acceleration: number,
    time: number
  ): number {
    return initialVelocity + acceleration * time;
  }
}
