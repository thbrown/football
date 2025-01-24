import { Player } from './player';
import { Football } from './football';

export class BallCarrier {
    private football: Football;

    private player: Player | null;
    private mostRecentPlayer: Player | null;
    private initialPlayer: Player;

    constructor() {}

    setFootball(football: Football) {
        this.football = football;
    }

    setCarrier(player: Player) {
        this.player = player;
        if(this.mostRecentPlayer == null) {
            this.mostRecentPlayer = player;
        }
        if(player != null) {
            this.initialPlayer = player;

            if(this.football != null) {
                this.football.resetPosition(true);
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
}
