"use client";

import type { RefObject } from "react";

interface GameScreenProps {
  tvRef: RefObject<HTMLDivElement | null>;
  screenRef: RefObject<HTMLDivElement | null>;
  scanlineRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  crtOn: boolean;
  turningOff: boolean;
}

export default function GameScreen({
  tvRef,
  screenRef,
  scanlineRef,
  canvasRef,
  crtOn,
  turningOff,
}: GameScreenProps) {
  return (
    <div
      ref={tvRef}
      id="tv"
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#070b09] p-1 shadow-[inset_0_0_80px_rgba(0,0,0,0.95),0_0_45px_rgba(16,185,129,0.10)] sm:p-2"
    >
      <div
        ref={screenRef}
        id="screen"
        className={`relative overflow-hidden rounded-md bg-black ${
          crtOn ? "crt" : ""
        } ${turningOff ? "turn-off" : ""}`}
        style={{
          boxShadow: crtOn
            ? "0 0 28px rgba(52,211,153,0.35), inset 0 0 30px rgba(0,0,0,0.85)"
            : "inset 0 0 30px rgba(0,0,0,0.9)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <div
          id="scanline"
          ref={scanlineRef}
          className={crtOn ? "scanline" : "pointer-events-none absolute inset-0"}
        />
        <canvas
          id="canvas"
          ref={canvasRef}
          width={1120}
          height={1040}
          className="absolute inset-0 block h-full w-full"
        />
      </div>
    </div>
  );
}
