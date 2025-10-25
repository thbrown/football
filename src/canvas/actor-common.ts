import { World } from "@dimforge/rapier2d";
import { Rapier } from "../utils/types";
import { ActorRegistry } from "./actor-registry";
import { MakePlay } from "../make-play";
import { BallCarrier } from "./ball-carrier";
import { Camera } from "./camera";
import { Actor } from "./actor";
import { Mouse } from "./mouse";

export class ActorCommon {
    public rapier: Rapier;
    public world: World;
    public actorRegistry: ActorRegistry;
    public ballCarrier: BallCarrier;

    constructor({
        rapier,
        world,
        actorRegistry,
        ballCarrier,
    }: {
        rapier: Rapier;
        world: World;
        actorRegistry: ActorRegistry;
        ballCarrier: BallCarrier;
    }) {
        this.rapier = rapier;
        this.world = world;
        this.actorRegistry = actorRegistry;
        this.ballCarrier = ballCarrier;
    }

    static takeSnapshot(toDuplicate: ActorCommon): ActorCommon {
        // TODO: can we just pass each piece of actorCommon to clone instead of saving a partially constructed version
        const common =  new ActorCommon({
            rapier: toDuplicate.rapier, // Not duplicated
            world: World.restoreSnapshot(toDuplicate.world.takeSnapshot()),
            ballCarrier: toDuplicate.ballCarrier.clone(),
            actorRegistry: undefined,
        });
        common.actorRegistry = toDuplicate.actorRegistry.clone(common);
        return common;
    }

    static getStepFunction(actorCommon: ActorCommon): (inputCtx: CanvasRenderingContext2D, inputCamera: Camera, inputPressedKeys: Set<string>) => void {
        return (inputCtx: CanvasRenderingContext2D, inputCamera: Camera, inputPressedKeys: Set<string>) => {
            const actors: Array<Actor> = actorCommon.actorRegistry.getActorListForDrawing();
            for (let actor of actors) {
                const colliderHandle = actor.getColliderHandle();
                const collider = actorCommon.world.getCollider(colliderHandle);
                const collisionHandles: number[] = [];
                actorCommon.world.intersectionPairsWith(collider, (otherHandle) => {
                    collisionHandles.push(otherHandle.handle);
                });

                actor.update(actorCommon, collisionHandles, inputPressedKeys);
                actorCommon.world.step();
                if(inputCtx != null) {
                    actor.draw(actorCommon, inputCtx, inputCamera);
                }
            }
            inputPressedKeys.clear();
        }
    }
}