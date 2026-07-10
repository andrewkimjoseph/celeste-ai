"use client";

import { useEffect, useRef } from "react";
import type { FxIntensity } from "@/lib/chat-db";

interface CelestialFxLayerProps {
  enabled: boolean;
  intensity: FxIntensity;
}

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinkle: number;
};

type Streak = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

export function CelestialFxLayer({ enabled, intensity }: CelestialFxLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reduceMotionRef.current = media.matches;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      pointerRef.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ctx2d = ctx;

    const config =
      intensity === "high"
        ? { stars: 48, streakChance: 0.012, drift: 0.1 }
        : intensity === "low"
          ? { stars: 16, streakChance: 0.003, drift: 0.04 }
          : { stars: 28, streakChance: 0.006, drift: 0.06 };

    let raf = 0;
    let running = true;
    const stars: Star[] = [];
    const streaks: Streak[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = Math.floor(window.innerWidth * dpr);
      canvasEl.height = Math.floor(window.innerHeight * dpr);
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function resetStars() {
      stars.length = 0;
      for (let i = 0; i < config.stars; i += 1) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * config.drift,
          vy: (Math.random() - 0.5) * config.drift,
          size: Math.random() * 0.9 + 0.25,
          alpha: Math.random() * 0.18 + 0.06,
          twinkle: Math.random() * 0.012 + 0.003,
        });
      }
    }

    function spawnStreak() {
      streaks.push({
        x: Math.random() * window.innerWidth * 0.9,
        y: Math.random() * (window.innerHeight * 0.45),
        vx: 7 + Math.random() * 5,
        vy: 2 + Math.random() * 2.5,
        life: 0,
        maxLife: 26 + Math.random() * 18,
      });
    }

    function draw() {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (!enabled || document.hidden) {
        ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
        return;
      }

      const reduceMotion = reduceMotionRef.current;
      const parallaxX = reduceMotion ? 0 : pointerRef.current.x * 3;
      const parallaxY = reduceMotion ? 0 : pointerRef.current.y * 2;

      ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const star of stars) {
        if (!reduceMotion) {
          star.x += star.vx;
          star.y += star.vy;
        }
        if (star.x < 0) star.x = window.innerWidth;
        if (star.x > window.innerWidth) star.x = 0;
        if (star.y < 0) star.y = window.innerHeight;
        if (star.y > window.innerHeight) star.y = 0;

        star.alpha += (Math.random() - 0.5) * star.twinkle;
        star.alpha = Math.max(0.05, Math.min(0.32, star.alpha));
        ctx2d.fillStyle = `rgba(204, 226, 255, ${star.alpha})`;
        ctx2d.beginPath();
        ctx2d.arc(
          star.x + parallaxX,
          star.y + parallaxY,
          star.size,
          0,
          Math.PI * 2,
        );
        ctx2d.fill();
      }

      if (!reduceMotion && Math.random() < config.streakChance) {
        spawnStreak();
      }

      for (let i = streaks.length - 1; i >= 0; i -= 1) {
        const s = streaks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        const t = s.life / s.maxLife;
        if (t >= 1) {
          streaks.splice(i, 1);
          continue;
        }
        const alpha = 1 - t;
        ctx2d.strokeStyle = `rgba(181, 213, 255, ${0.32 * alpha})`;
        ctx2d.lineWidth = 0.9;
        ctx2d.beginPath();
        ctx2d.moveTo(s.x + parallaxX, s.y + parallaxY);
        ctx2d.lineTo(s.x - 18 + parallaxX, s.y - 6 + parallaxY);
        ctx2d.stroke();
      }
    }

    resize();
    resetStars();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [enabled, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
