

export class Clock {
  private timeElapsed: number; // Time in miliseconds
  private isActive: boolean;
  private lastUpdateTime: number;
  private maxTime: number;
  private onResetListeners: ((hardReset: boolean) => void)[] = [];

  private setMaxTime: (maxTime: number) => void;
  private setCurrentTime: (currentTime: number ) => void;

  constructor(setMaxTime: (maxTime: number) => void, setCurrentTime: (currentTime: number) => void) {
    this.timeElapsed = 0;
    this.isActive = false;
    this.lastUpdateTime = performance.now();
    this.maxTime = 0;

    this.setCurrentTime = setCurrentTime;
    this.setMaxTime = setMaxTime;
  }

  start(): void {
    this.isActive = true;
    this.lastUpdateTime = performance.now();
  }

  stop(): void {
    this.isActive = false;
  }

  gotoTime(time: number): void {
    if(time > this.maxTime) {
      time = this.maxTime;
    }
    this.timeElapsed = time;
    this.setCurrentTime(this.timeElapsed);
  }

  update(): void {
    if (this.isActive) {
      const now = performance.now();
      this.timeElapsed += (now - this.lastUpdateTime);
      this.lastUpdateTime = now;
      this.setCurrentTime(this.timeElapsed);
      this.maybeSetMaxTime(this.timeElapsed);
    }
  }

  getElapsedTime(): number {
    return this.timeElapsed;
  }

  reset(hardReset: boolean): void {
    this.timeElapsed = 0;
    this.setCurrentTime(this.timeElapsed);
    for(const listener of this.onResetListeners) {
      listener(hardReset);
    }
  }
  
  setResetListener(listener: (hardReset: boolean) => void): void {
    this.onResetListeners.push(listener);
  } 

  maybeSetMaxTime(newMax: number): void {
    this.maxTime = Math.max(this.maxTime, newMax);
    this.setMaxTime(this.maxTime);
  }

  getMaxTime(): number {
    return this.maxTime;
  }

}
