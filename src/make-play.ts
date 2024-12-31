import { ReplayState } from "./utils/types";

export class MakePlay {
    private replayState: ReplayState;

    constructor() {
        this.replayState = "replay";
    }

    getReplayState() {
        return this.replayState;
    }

    setReplayState(replayState: ReplayState) {
        this.replayState = replayState;
    }
}