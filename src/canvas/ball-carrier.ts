import { Player } from './player';
import { Football } from './football';
import { ActorCommon } from './actor-common';

export class BallCarrier {
    private football: Football;

    private player: Player | null;
    private mostRecentPlayer: Player | null;
    private initialPlayer: Player;

    constructor() {}

    setFootball(football: Football) {
        this.football = football;
    }

    // Passing common here seems a bit weird
    setCarrier(common: ActorCommon, player: Player) {
        this.player = player;
        if(player != null) {
            this.mostRecentPlayer = player;
        }
        if(player != null && this.initialPlayer == null) {
            this.initialPlayer = player;
            if(this.football != null) {
                this.football.resetPosition(common, true);
            }
        }
    }
    
    getPlayer() {
        return this.player;
    }

    getFootball() {
        return this.football;
    }

    getInitialPlayer() {
        return this.initialPlayer;
    }

    getMostRecentPlayer() {
        return this.mostRecentPlayer;
    }

    reset() {
        this.player = this.initialPlayer;
        this.mostRecentPlayer = this.initialPlayer; 
    }

    clearPlayerState() {
        this.player = null;
        this.mostRecentPlayer = null;
        this.initialPlayer = null;
    }

    clone(): BallCarrier {
        const carrier = new BallCarrier();
        carrier.football = this.football;
        carrier.player = this.player;
        carrier.mostRecentPlayer = this.mostRecentPlayer;
        carrier.initialPlayer = this.initialPlayer;
        return carrier;
    }
}
