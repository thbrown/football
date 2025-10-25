import { ActorCommon } from "./canvas/actor-common";


export class Clock {
  private timeElapsed: number; // Time in miliseconds
  private isActive: boolean;
  private isRecording: boolean;
  private lastUpdateTime: number;
  private maxTime: number;
  private onResetListeners: ((common: ActorCommon, hardReset: boolean) => void)[] = [];

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

  record(): void {
    this.isActive = true;
    this.isRecording = true;
    this.lastUpdateTime = performance.now();
  }

  play(): void {
    this.isActive = true;
    this.lastUpdateTime = performance.now();
  }

  stop(): void {
    this.isActive = false;
    this.isRecording = false;
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

  reset(common: ActorCommon, hardReset: boolean): void {
    this.timeElapsed = 0;
    this.setCurrentTime(this.timeElapsed);
    for(const listener of this.onResetListeners) {
      listener(common, hardReset);
    }
  }
  
  setResetListener(listener: (common: ActorCommon, hardReset: boolean) => void): void {
    this.onResetListeners.push(listener);
  } 

  maybeSetMaxTime(newMax: number): void {
    this.maxTime = Math.max(this.maxTime, newMax);
    this.setMaxTime(this.maxTime);
  }

  getMaxTime(): number {
    return this.maxTime;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  clone(): Clock {
    const clone = new Clock(this.setMaxTime, this.setCurrentTime);
    clone.timeElapsed = this.timeElapsed;
    clone.isActive = this.isActive;
    clone.isRecording = this.isRecording;
    clone.lastUpdateTime = this.lastUpdateTime;
    clone.maxTime = this.maxTime;
    clone.setCurrentTime = this.setCurrentTime;
    clone.setMaxTime = this.setMaxTime;
    clone.onResetListeners = this.onResetListeners.slice();
    return clone;
  }

}
