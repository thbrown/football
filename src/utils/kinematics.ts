import { GRAVITY } from "./constants";

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

  static getFinalVelocity2(
    initialVelocity: number,
    acceleration: number,
    distance: number
  ): number {
    return Math.sqrt(Math.pow(initialVelocity, 2) + 2 * acceleration * distance);
  }
  
  /**
   * Calculates the launch angle required to reach a certain distance given the initial velocity.
   * Prints the maximum distance allowed at the given velocity.
   * Returns PI/4 radians (45 degrees) if the distance is unreachable at the given velocity.
   * 
   * @param distance 
   * @param initialVelocity 
   * @returns 
   */
  static calcMinLaunchAngle(distance: number, initialVelocity: number): number {
    const g = GRAVITY;

    // Calculate the maximum reachable distance
    console.log(`Initial velocity: ${initialVelocity} ft/s, Graviry ${g} ft/s², Distance: ${distance} feet`);
    const maxDistance = (Math.pow(initialVelocity, 2) / g);
    console.log(`Maximum reachable distance: ${maxDistance.toFixed(2)} feet`);

    // Check if the player has the power to reach the distance
    const sin2Theta = (distance * g) / Math.pow(initialVelocity, 2);
    if (sin2Theta > 1) {
      console.log("Distance is unreachable with the given velocity.");
      return Math.PI / 4; // Impossible to reach; default to 45 degrees
    }

    // Calculate the minimum launch angle
    const twoTheta = Math.asin(sin2Theta); // In radians
    const theta = twoTheta / 2;

    return theta;
  }

  static calcHeight(
    initialHeight: number,
    initialVelocity: number,
    time: number
  ): number {
    return (
      initialHeight +
      initialVelocity * time +
      0.5 * -GRAVITY * Math.pow(time, 2)
    );
  }

  static calcLandingTime(
    initialHeight: number,
    initialVelocity: number
  ): number {
    return (initialVelocity + Math.sqrt(Math.pow(initialVelocity, 2) + 2 * GRAVITY * initialHeight)) / GRAVITY;
  }
  
}
