"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient particle backdrop for the landing hero. Adapted from 21st.dev's
 * "Aether Flow Hero" (dhileepkumargm) — stripped to just the canvas system
 * (the original's own headline/CTA overlay is dropped; this hero already has
 * one), recolored to the brand palette, dimmed to sit behind real content,
 * and sized to its parent section rather than the full viewport.
 */
export function AetherParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    interface Particle {
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
    }

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    const mouse = { x: null as number | null, y: null as number | null, radius: 160 };

    function seed() {
      particles = [];
      const count = Math.floor((width * height) / 22000);
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 1.6 + 0.8;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          dx: (Math.random() * 0.3) - 0.15,
          dy: (Math.random() * 0.3) - 0.15,
          size,
        });
      }
    }

    function resize() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      seed();
    }

    function connect() {
      if (!ctx) return;
      const linkDistanceSq = (width / 7) * (height / 7);
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkDistanceSq) {
            const alpha = (1 - distSq / linkDistanceSq) * 0.13;
            const midX = (particles[a].x + particles[b].x) / 2;
            const midY = (particles[a].y + particles[b].y) / 2;
            const nearMouse =
              mouse.x !== null &&
              mouse.y !== null &&
              (midX - mouse.x) ** 2 + (midY - mouse.y) ** 2 < mouse.radius * mouse.radius;
            // Green ties into the brand's live/streaming accent — lines near
            // the cursor read as "activated," matching the product's own
            // live-state color language rather than a generic hover glow.
            ctx.strokeStyle = nearMouse ? `rgba(76,175,125,${alpha})` : `rgba(56,152,236,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function step() {
      if (!ctx) return;
      // Translucent navy fill (not a hard clear) leaves a soft trail behind
      // each particle instead of a flat wipe, and keeps the canvas reading as
      // part of the page's own dark ground rather than a black rectangle.
      ctx.fillStyle = "rgba(8,17,28,0.16)";
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        if (p.x > width || p.x < 0) p.dx = -p.dx;
        if (p.y > height || p.y < 0) p.dy = -p.dy;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius + p.size) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= (dx / dist) * force * 3;
            p.y -= (dy / dist) * force * 3;
          }
        }

        p.x += p.dx;
        p.y += p.dy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,152,236,0.24)";
        ctx.fill();
      }

      connect();
      animationFrameId = requestAnimationFrame(step);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouse.x = null;
      mouse.y = null;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    if (!reduceMotion) {
      step();
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    } else {
      // Static single frame — connections only, no motion, no listeners.
      connect();
    }

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Fades the field out toward the left, where the headline and copy sit, so
  // density reads as depth in the empty space rather than competing with text.
  const fadeMask = "linear-gradient(to right, transparent 0%, transparent 45%, rgba(0,0,0,0.5) 65%, black 85%)";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        maskImage: fadeMask,
        WebkitMaskImage: fadeMask,
      }}
    />
  );
}
