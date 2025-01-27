import { World } from "@dimforge/rapier2d";
import { Rapier } from "../utils/types";
import { ActorRegistry } from "./actor-registry";
import { MakePlay } from "../make-play";
import { BallCarrier } from "./ball-carrier";
import { Camera } from "./camera";
import { Actor } from "./actor";

export class ActorCommon {
    public rapier: Rapier;
    public world: World;
    public actorRegistry: ActorRegistry;
    public scene: MakePlay;
    public ballCarrier: BallCarrier;

    constructor({
        rapier,
        world,
        actorRegistry,
        scene,
        ballCarrier,
    }: {
        rapier: Rapier;
        world: World;
        actorRegistry: ActorRegistry;
        scene: MakePlay;
        ballCarrier: BallCarrier;
    }) {
        this.rapier = rapier;
        this.world = world;
        this.actorRegistry = actorRegistry;
        this.scene = scene;
        this.ballCarrier = ballCarrier;
    }

    static takeSnapshot(toDuplicate: ActorCommon): ActorCommon {
        return new ActorCommon({
            rapier: toDuplicate.rapier, // Not duplicated
            world: World.restoreSnapshot(toDuplicate.world.takeSnapshot()),
            actorRegistry: JSON.parse(JSON.stringify(toDuplicate.actorRegistry)),
            scene: JSON.parse(JSON.stringify(toDuplicate.scene)),
            ballCarrier: JSON.parse(JSON.stringify(toDuplicate.ballCarrier)),
        });
    }

    static getStepFunction(actorCommon: ActorCommon): (inputCtx: CanvasRenderingContext2D, inputCamera: Camera, inputPressedKeys: Set<string>) => void {
        return (inputCtx: CanvasRenderingContext2D, inputCamera: Camera, inputPressedKeys: Set<string>) => {
            const actors: Array<Actor> = actorCommon.actorRegistry.getActorListForDrawing();
            for (let actor of actors) {
                const handle = actor.getHandle();
                const collider = actorCommon.world.getCollider(handle);
                const collisionHandles: number[] = [];
                actorCommon.world.intersectionPairsWith(collider, (otherHandle) => {
                    collisionHandles.push(otherHandle.handle);
                });

                actor.update(collisionHandles, inputPressedKeys);
                actorCommon.world.step();
                actor.draw(inputCtx, inputCamera);
            }
            inputPressedKeys.clear();
        }
    }
}