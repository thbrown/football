import * as React from "react";
import { useEffect, useRef } from "react";
import { Camera } from "../canvas/camera";
import { Player } from "../canvas/player";
import { Field } from "../canvas/field";
import { ActorCommon, ActorRegistry, Rapier } from "../utils/types";
import { Mouse } from "../canvas/mouse";
import { Actor } from "../canvas/actor";
import { Clock } from "../canvas/clock";
import { FIELD_LENGTH, FIELD_WIDTH } from "../utils/constants";

const camera = new Camera();

export const Football = () => {
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
      const actorRegistry: ActorRegistry = new Map();
      const common: ActorCommon = {
        rapier: RAPIER,
        world,
        eventQueue,
        actorRegistry,
      };

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      //const player = new Player(RAPIER, world, 10, 0, 0.75);
      const field = new Field({
        common,
        x: 0,
        y: 0,
        width: FIELD_WIDTH,
        height: FIELD_LENGTH,
      });
      const clock = new Clock({ common });
      const mouse = new Mouse({
        common,
        camera,
        canvas: canvasRef.current,
        radius: 0.25,
        clock,
        addActor: (actor: Actor) => {
          actors.push(actor);
        },
      });

      const actors: Array<Actor> = [field, clock, mouse];

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
    </div>
  );
};
