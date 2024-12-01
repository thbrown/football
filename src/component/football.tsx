import * as React from "react";
import { useEffect, useRef } from "react";

export const Football = () => {
  const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    const needResize =
      canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    return needResize;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvasToDisplaySize(canvas);

    let ballX = 50;
    let ballY = 50;
    let ballSpeedX = 2;
    let ballSpeedY = 2;
    const ballRadius = 20;

    const handleResize = () => {
      if (canvasRef.current) {
        resizeCanvasToDisplaySize(canvasRef.current);
      }
    };

    const drawBall = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.closePath();

      // Move the ball
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Bounce the ball off the walls
      if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) {
        ballSpeedX *= -1;
      }
      if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
        ballSpeedY *= -1;
      }

      requestAnimationFrame(drawBall);
    };

    drawBall();

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
        style={{ width: "100%", height: "100%", border: "1px solid black" }}
      ></canvas>
    </div>
  );
};
