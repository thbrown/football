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
import { Player } from "../canvas/player";
import createRBTree, { Tree } from "functional-red-black-tree";
import { PhysicsWorldHistory } from "../physics-world-history";
import { Kinematics } from "../utils/kinematics";
import { BallCarrier } from "../canvas/ball-carrier";
import { Football } from "../canvas/football";

const camera = new Camera();
const scene = new MakePlay();

export const Main = () => {

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

      const SPEED = 100;
      const launchAngle = Kinematics.calcMinLaunchAngle(1000, SPEED);
      const angleDegrees = (launchAngle * 180) / Math.PI;
      const landingTime = Kinematics.calcLandingTime(0, SPEED*Math.sin(launchAngle));
      console.log("DEG", angleDegrees, landingTime);

      for(let time = 0; time < (landingTime + 1); time += .5) {
        const height = Kinematics.calcHeight(0, SPEED*Math.sin(launchAngle), time);
        console.log(time, height);
      }
      /*
      for(let angle = 0; angle < 360; angle += 45) {
        Kinematics
      }*/
    }

    return needResize;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  
  // Key Listeners
  const pressedKeys = useRef<Set<string>>(new Set());
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    
  }, []);

  useEffect(() => {
    import("@dimforge/rapier2d").then((RAPIER: Rapier) => {
      console.log("Loaded rapier2d", RAPIER);
      const gravity = { x: 0.0, y: 0 };
      const eventQueue = new RAPIER.EventQueue(true);
      const world = new RAPIER.World(gravity);
      const physicsWorldHistory = new PhysicsWorldHistory(world);
      const actorRegistry: ActorRegistry = new ActorRegistry();
      const ballCarrier = new BallCarrier();

      const common: ActorCommon = {
        rapier: RAPIER,
        world,
        eventQueue,
        actorRegistry,
        scene: scene,
        physicsWorldHistory,
        ballCarrier: ballCarrier,
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
      });
      const football = new Football({
        common: common,
        clock: clockActor,
        x: 0,
        y: 0,
      });

      ballCarrier.setFootball(football);

      actorRegistry.addActor(field);
      actorRegistry.addActor(football);
      actorRegistry.addActor(clockActor);
      actorRegistry.addActor(mouse);

      const animate = () => {
        const actors: Array<Actor> = actorRegistry.getActorListForDrawing();
        for (let actor of actors) {
          const handle = actor.getHandle();
          const collider = world.getCollider(handle);
          const collisionHandles: number[] = [];
          world.intersectionPairsWith(collider, (otherHandle) => {
            collisionHandles.push(otherHandle.handle);
          });

          actor.update(collisionHandles, pressedKeys.current);
          world.step(eventQueue);
          actor.draw(ctx, camera);
        }
        if(clock.getIsRecording()) {
          physicsWorldHistory.addPhysicsAtTime(clock.getElapsedTime(), world);
        }
        pressedKeys.current.clear();
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
      <Track clock={clock} scene={scene}></Track>
    </div>
  );
};
