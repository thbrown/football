import { ReplayState } from "./utils/types";

export class MakePlay {
    private replayState: ReplayState;

    constructor() {
        this.replayState = "replay";
    }

    // Moved this to the clock
    /*
    getReplayState() {
        return this.replayState;
    }

    setReplayState(replayState: ReplayState) {
        this.replayState = replayState;
    }
        */
}