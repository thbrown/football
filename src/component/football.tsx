import * as React from "react";
import { useEffect, useRef } from "react";
import { Camera } from "../canvas/camera";
import { Field } from "../canvas/field";
import { ActorCommon, Rapier, ReplayState } from "../utils/types";
import { Mouse } from "../canvas/mouse";
import { Actor } from "../canvas/actor";
import { ClockActor } from "../canvas/clock-actor";
import { FIELD_LENGTH, FIELD_WIDTH } from "../utils/constants";
import { Track } from "./track";
import { Clock } from "../clock";
import { MakePlay } from "../make-play";
import { ActorRegistry } from "../canvas/actor-registry";

const camera = new Camera();
//const clock = new Clock();

export const Football = () => {

  // These exists just to trigger a re-render when the clock changes
  const [, setMaxTime] = React.useState<number>(0);
  const [, setCurrentTime] = React.useState<number>(0);
  const [clock] = React.useState<Clock>(new Clock(setMaxTime, setCurrentTime));

  const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    const needResize =
      canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
      console.log("RESIZE");
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      camera.setCanvasDimensions(displayWidth, displayHeight);
    }

    return needResize;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    import("@dimforge/rapier2d").then((RAPIER: Rapier) => {
      console.log("Loaded rapier2d", RAPIER);
      const gravity = { x: 0.0, y: 0 };
      const eventQueue = new RAPIER.EventQueue(true);
      const world = new RAPIER.World(gravity);
      const actorRegistry: ActorRegistry = new ActorRegistry();
      const common: ActorCommon = {
        rapier: RAPIER,
        world,
        eventQueue,
        actorRegistry,
        scene: new MakePlay()
      };

      console.log(world.timestep);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const field = new Field({
        common,
        x: 0,
        y: 0,
        width: FIELD_WIDTH,
        height: FIELD_LENGTH,
      });
      const clockActor = new ClockActor({ common, clock });
      const mouse = new Mouse({
        common,
        camera,
        canvas: canvas,
        radius: 0.25,
        clock: clockActor,
        addActor: (actor: Actor) => {
          actors.push(actor);
        },
      });

      const actors: Array<Actor> = [field, clockActor, mouse];

      const animate = () => {
        for (let actor of actors) {
          const handle = actor.getHandle();
          const collider = world.getCollider(handle);
          const collisionHandles: number[] = [];
          world.intersectionPairsWith(collider, (otherHandle) => {
            collisionHandles.push(otherHandle.handle);
          });

          actor.update(collisionHandles);
          world.step(eventQueue);
          actor.draw(ctx, camera);
        }
        requestAnimationFrame(animate);
      };

      animate();
    });

    const handleResize = () => {
      if (canvasRef.current) {
        resizeCanvasToDisplaySize(canvasRef.current);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      <h1>Football</h1>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      ></canvas>
      <Track clock={clock}></Track>
    </div>
  );
};
