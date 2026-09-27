import React, { useEffect, useRef } from 'react';

interface BokehOrb {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  hue: number;
  alpha: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  twinklePhase: number;
}

export const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create 16 atmospheric bokeh orbs
    const orbs: BokehOrb[] = Array.from({ length: 14 }).map((_, i) => {
      const radius = 80 + Math.random() * 160;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseRadius: radius,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.35,
        // Color shifts between cyan (180), royal blue (220), violet (270)
        hue: 200 + (i * 15) % 80,
        alpha: 0.08 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
      };
    });

    // Create 50 subtle floating stardust particles
    const particles: Particle[] = Array.from({ length: 55 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.8 + Math.random() * 2.2,
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.2 + Math.random() * 0.6,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.008;

      // Base background: slow changing rich dark palette
      const hueShift = Math.sin(time * 0.5) * 20;
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      
      gradient.addColorStop(0, `hsl(${225 + hueShift}, 45%, 11%)`);
      gradient.addColorStop(0.5, `hsl(${235 + hueShift}, 55%, 7%)`);
      gradient.addColorStop(1, '#020617');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle bokeh orbs
      ctx.save();
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Wrap around bounds softly
        if (orb.x < -orb.radius) orb.x = width + orb.radius;
        if (orb.x > width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;

        const pulse = Math.sin(time + orb.phase) * 15;
        const currentRadius = Math.max(10, orb.baseRadius + pulse);

        const radial = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          currentRadius
        );
        radial.addColorStop(0, `hsla(${orb.hue + hueShift}, 85%, 65%, ${orb.alpha})`);
        radial.addColorStop(0.5, `hsla(${orb.hue + hueShift}, 75%, 55%, ${orb.alpha * 0.4})`);
        radial.addColorStop(1, `hsla(${orb.hue + hueShift}, 70%, 50%, 0)`);

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw floating stardust particles
      ctx.save();
      for (const p of particles) {
        p.y -= p.speed;
        p.twinklePhase += 0.03;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.twinklePhase));

        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Top and bottom ambient stage vignetting for television/game-show depth
      const topVignette = ctx.createLinearGradient(0, 0, 0, 160);
      topVignette.addColorStop(0, 'rgba(2, 6, 23, 0.7)');
      topVignette.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = topVignette;
      ctx.fillRect(0, 0, width, 160);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{ display: 'block' }}
    />
  );
};
