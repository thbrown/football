import { Actor } from "./actor";

export class ActorRegistry {

    private actorTypeLookup: Map<string, Actor[]> = new Map();
    private actorLookup: Map<number, Actor>;

    constructor() {
        this.actorLookup = new Map();
    }

    getActor(handle: number): Actor | undefined {
        return this.actorLookup.get(handle);
    }

    getActorsByType(type: string): Actor[] {
        return this.actorTypeLookup.get(type) || [];
    }

    addActor(actor: Actor): void {
        this.actorLookup.set(actor.getHandle(), actor);
    
        const actorType = actor.constructor.name;
        if (!this.actorTypeLookup.has(actorType)) {
            this.actorTypeLookup.set(actorType, []);
        }
        this.actorTypeLookup.get(actorType)?.push(actor);
        console.log(this.actorTypeLookup);
        this.actorLookup.set(actor.getHandle(), actor);
    }
    
    removeActor(actor: Actor): void {
        this.actorLookup.delete(actor.getHandle());
    
        const actorType = actor.constructor.name;
        const actorsOfType = this.actorTypeLookup.get(actorType);
        if (actorsOfType) {
            const index = actorsOfType.indexOf(actor);
            if (index > -1) {
                actorsOfType.splice(index, 1);
            }
            if (actorsOfType.length === 0) {
                this.actorTypeLookup.delete(actorType);
            }
        }
    }

    getActorListForDrawing(): Actor[] {
        const actors = Array.from(this.actorLookup.values());
        actors.sort((a, b) => a.getDepth() - b.getDepth());
        //console.log(actors);
        return actors;
    }

}