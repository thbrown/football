import { Actor } from "./actor";

export class ActorRegistry {

    private actorTypeLookup: { [key: string]: Actor[] } = {};
    private actorLookup: { [key: string]: Actor } = {};

    getActor(handle: number): Actor | undefined {
        return this.actorLookup[handle];
    }

    getActorsByType(type: string): Actor[] {
        return this.actorTypeLookup[type] || [];
    }

    addActor(actor: Actor): void {
        this.actorLookup[actor.getHandle()] = actor;
    
        const actorType = actor.constructor.name;
        if (!this.actorTypeLookup[actorType]) {
            this.actorTypeLookup[actorType] = [];
        }
        this.actorTypeLookup[actorType].push(actor);
        console.log(this.actorTypeLookup);
    }
    
    removeActor(actor: Actor): void {
        delete this.actorLookup[actor.getHandle()];
    
        const actorType = actor.constructor.name;
        const actorsOfType = this.actorTypeLookup[actorType];
        if (actorsOfType) {
            const index = actorsOfType.indexOf(actor);
            if (index > -1) {
                actorsOfType.splice(index, 1);
            }
            if (actorsOfType.length === 0) {
                delete this.actorTypeLookup[actorType];
            }
        }
    }

    getActorListForDrawing(): Actor[] {
        const actors = Object.values(this.actorLookup);
        actors.sort((a, b) => a.getDepth() - b.getDepth());
        //console.log(actors);
        return actors;
    }

}
