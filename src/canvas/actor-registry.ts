import { Actor } from "./actor";
import { ActorCommon } from "./actor-common";
import { Mouse } from "./mouse";
import { Player } from "./player";

export class ActorRegistry {

    private actorTypeLookup: { [key: string]: Actor[] } = {};
    private actorLookupByRidgidBodyHandle: { [key: string]: Actor } = {};
    private actorLookupByColliderHandle: { [key: string]: Actor } = {};

    // This doesn't seem to work because handle Ids are duplicated between ridgidBody and collider for some reason
    /*
    getActor(handle: number): Actor | undefined {
        const actor = this.actorLookupByRidgidBodyHandle[handle];
        return actor ?? this.actorLookupByColliderHandle[handle];
    }*/

    getActorByRidgidBodyHandle(handle: number): Actor | undefined {
        return this.actorLookupByRidgidBodyHandle[handle];
    }

    getActorByColliderHandle(handle: number): Actor | undefined {
        return this.actorLookupByColliderHandle[handle];
    }

    getActorsByType(type: string): Actor[] {
        return this.actorTypeLookup[type] || [];
    }

    addActor(actor: Actor): void {
        const ridgidBodyHandle = actor.getRigidBodyHandle();
        if(this.actorLookupByRidgidBodyHandle[ridgidBodyHandle] != null) {
            throw new Error(`Actor already exists with ridgidBodyHandle ${ridgidBodyHandle}`);
        }
        this.actorLookupByRidgidBodyHandle[ridgidBodyHandle] = actor;
        const colliderHandle = actor.getColliderHandle();
        if(colliderHandle != null) {
            if(this.actorLookupByColliderHandle[colliderHandle] != null) {
                throw new Error(`Actor already exists with colliderHandle ${colliderHandle}`);
            }
            this.actorLookupByColliderHandle[colliderHandle] = actor;
        }

        if(actor instanceof Player) {
            console.log("ADDED PLAYER", actor.getNumber(), colliderHandle, actor.getRigidBodyHandle());
        }
    
        const actorType = actor.constructor.name;
        if (this.actorTypeLookup[actorType] == null) {
            this.actorTypeLookup[actorType] = [];
        }
        this.actorTypeLookup[actorType].push(actor);
    }
    
    removeActor(actor: Actor): void {
        delete this.actorLookupByRidgidBodyHandle[actor.getRigidBodyHandle()];
        if(actor.getColliderHandle() != null) {
            delete this.actorLookupByColliderHandle[actor.getColliderHandle()];
        }
    
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
        const actors = Object.values(this.actorLookupByRidgidBodyHandle);
        actors.sort((a, b) => a.getDepth() - b.getDepth());
        return actors;
    }

    clone(common: ActorCommon): ActorRegistry {
        // TODO: I think we need to clone clock first
        const clone = new ActorRegistry();
        for (const actorType in this.actorTypeLookup) {
            for (const actor of this.actorTypeLookup[actorType]) {
                const filteredRegistry = new ActorRegistry();
                // Mouse has a reference to HTML canvas and can not be serialized for copy
                if(!(actor instanceof Mouse)) {
                    clone.addActor(actor.clone(clone, common));
                }
            }
        }
        return clone;
    }
}