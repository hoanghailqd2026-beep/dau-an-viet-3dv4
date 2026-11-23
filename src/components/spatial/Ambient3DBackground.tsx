import React, { useEffect, useRef } from 'react';

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

/**
 * GLOBAL 3D AMBIENT CANVAS (<Ambient3DBackground />)
 * - Renders 60FPS Golden Archival Particles in 3D space with perspective depth
 *   (near particles larger & softly glowing, far particles fine & twinkling)
 * - Renders 3D Architectural Compass & Astrolabe orbital rings (rgba(197, 160, 89, 0.08))
 * - Reacts to mouse cursor position, mouse velocity, and scroll velocity across all pages
 */
export const Ambient3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Keep 3D ambient spatial particles running smoothly across all machines
    const prefersReducedMotion = false;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Create 135 3D Golden Archival Particles across depth z in [-500, 500]
    const PARTICLE_COUNT = 135;
    const DEPTH_RANGE = 900;
    const FOCAL_LENGTH = 620;

    const particles: Particle3D[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 1.45,
      y: (Math.random() - 0.5) * height * 1.45,
      z: Math.random() * DEPTH_RANGE - DEPTH_RANGE * 0.5,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.12 - Math.random() * 0.22,
      vz: (Math.random() - 0.5) * 0.28,
      baseRadius: 0.9 + Math.random() * 2.1,
      alpha: 0.22 + Math.random() * 0.58,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.025,
    }));

    // Mouse & Scroll camera state
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let lastRawMouseX = width * 0.5;
    let lastRawMouseY = height * 0.5;
    let scrollVelocity = 0;
    let compassRotation = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / Math.max(1, width) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, height) - 0.5) * 2;
      targetMouseX = nx;
      targetMouseY = ny;

      mouseVelX = Math.max(-18, Math.min(18, (e.clientX - lastRawMouseX) * 0.08));
      mouseVelY = Math.max(-18, Math.min(18, (e.clientY - lastRawMouseY) * 0.08));
      lastRawMouseX = e.clientX;
      lastRawMouseY = e.clientY;
    };

    let lastScrollTop = 0;
    const handleScrollCapture = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const currentTop =
        target instanceof Document
          ? window.scrollY
          : target && typeof target.scrollTop === 'number'
          ? target.scrollTop
          : window.scrollY;
      const delta = currentTop - lastScrollTop;
      lastScrollTop = currentTop;
      scrollVelocity = Math.max(-28, Math.min(28, delta * 0.35));
    };

    const handleWheelCapture = (e: WheelEvent) => {
      scrollVelocity = Math.max(-28, Math.min(28, e.deltaY * 0.14));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScrollCapture, { capture: true, passive: true });
    window.addEventListener('wheel', handleWheelCapture, { passive: true });

    let animId: number;

    const draw3DCompassRing = (
      cx: number,
      cy: number,
      radius: number,
      tiltX: number,
      tiltY: number,
      rotZ: number,
      strokeAlpha: number,
      dashed: boolean,
      tickCount = 0
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tiltY * 0.22);
      const scaleY = Math.max(0.28, Math.min(1, Math.cos(tiltX)));
      ctx.scale(1, scaleY);
      ctx.rotate(rotZ);

      ctx.beginPath();
      if (dashed) {
        ctx.setLineDash([6, 10]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = `rgba(197, 160, 89, ${strokeAlpha})`;
      ctx.lineWidth = 1;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw subtle geodetic degree ticks on architectural compass ring
      if (tickCount > 0) {
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(197, 160, 89, ${strokeAlpha * 1.15})`;
        for (let i = 0; i < tickCount; i++) {
          const angle = (i / tickCount) * Math.PI * 2;
          const isMajor = i % 4 === 0;
          const innerR = radius - (isMajor ? 9 : 4);
          const outerR = radius + (isMajor ? 3 : 0);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
          ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const render = () => {
      animId = requestAnimationFrame(render);

      // Smooth damping of mouse and velocity
      currentMouseX += (targetMouseX - currentMouseX) * 0.055;
      currentMouseY += (targetMouseY - currentMouseY) * 0.055;
      mouseVelX *= 0.92;
      mouseVelY *= 0.92;
      scrollVelocity *= 0.9;

      compassRotation += 0.0014 + scrollVelocity * 0.0005 + mouseVelX * 0.0004;

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5 + currentMouseX * 28;
      const centerY = height * 0.5 + currentMouseY * 22;
      const baseOrbitR = Math.min(width, height) * 0.38;

      // 1. Draw 3D Architectural Compass Orbital Rings in the background
      draw3DCompassRing(
        centerX,
        centerY,
        baseOrbitR * 1.18,
        0.92 + currentMouseY * 0.24,
        currentMouseX * 0.35,
        compassRotation,
        0.085,
        false,
        36
      );
      draw3DCompassRing(
        centerX,
        centerY,
        baseOrbitR * 0.86,
        -0.78 + currentMouseY * 0.28,
        -currentMouseX * 0.4,
        -compassRotation * 1.35,
        0.075,
        true,
        0
      );
      draw3DCompassRing(
        centerX,
        centerY,
        baseOrbitR * 0.54,
        1.08 - currentMouseY * 0.2,
        currentMouseX * 0.5,
        compassRotation * 0.8,
        0.065,
        false,
        16
      );

      // Subtle crosshair axis lines through the 3D compass center
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentMouseX * 0.08);
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-baseOrbitR * 1.32, 0);
      ctx.lineTo(baseOrbitR * 1.32, 0);
      ctx.moveTo(0, -baseOrbitR * 0.72);
      ctx.lineTo(0, baseOrbitR * 0.72);
      ctx.stroke();
      ctx.restore();

      // 2. Update & Project 3D Golden Archival Particles
      const camYaw = currentMouseX * 0.24;
      const camPitch = currentMouseY * 0.18;
      const cosY = Math.cos(camYaw);
      const sinY = Math.sin(camYaw);
      const cosX = Math.cos(camPitch);
      const sinX = Math.sin(camPitch);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx - mouseVelX * 0.22;
          p.y += p.vy - scrollVelocity * 0.35 - mouseVelY * 0.16;
          p.z += p.vz + Math.abs(scrollVelocity) * 0.15;
          p.twinklePhase += p.twinkleSpeed;
        }

        // Wrap around 3D volume bounds
        const boundX = width * 0.78;
        const boundY = height * 0.78;
        const halfDepth = DEPTH_RANGE * 0.5;

        if (p.x > boundX) p.x = -boundX;
        else if (p.x < -boundX) p.x = boundX;

        if (p.y > boundY) p.y = -boundY;
        else if (p.y < -boundY) p.y = boundY;

        if (p.z > halfDepth) p.z = -halfDepth;
        else if (p.z < -halfDepth) p.z = halfDepth;

        // 3D rotation by camera yaw & pitch
        const rx = p.x * cosY - p.z * sinY;
        const rz1 = p.z * cosY + p.x * sinY;
        const ry = p.y * cosX - rz1 * sinX;
        const rz = rz1 * cosX + p.y * sinX;

        const perspectiveDenom = FOCAL_LENGTH + rz + DEPTH_RANGE * 0.55;
        if (perspectiveDenom <= 40) continue;

        const scale = FOCAL_LENGTH / perspectiveDenom;
        const screenX = width * 0.5 + rx * scale;
        const screenY = height * 0.5 + ry * scale;

        if (screenX < -40 || screenX > width + 40 || screenY < -40 || screenY > height + 40) {
          continue;
        }

        const twinkle = 0.65 + 0.35 * Math.sin(p.twinklePhase);
        const radius = Math.max(0.55, p.baseRadius * scale);
        const isForeground = scale > 1.22;

        if (isForeground) {
          // Near particle: larger & softly blurred bokeh glow
          const glowRadius = radius * 3.1;
          const grad = ctx.createRadialGradient(
            screenX,
            screenY,
            0,
            screenX,
            screenY,
            glowRadius
          );
          const nearAlpha = Math.min(0.32, p.alpha * twinkle * 0.45);
          grad.addColorStop(0, `rgba(218, 184, 114, ${nearAlpha})`);
          grad.addColorStop(0.45, `rgba(197, 160, 89, ${nearAlpha * 0.45})`);
          grad.addColorStop(1, 'rgba(197, 160, 89, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Mid/Far particle: crisp golden archival dust speck
          const farAlpha = Math.min(0.65, p.alpha * twinkle * Math.min(1, scale * 0.95));
          ctx.fillStyle = `rgba(212, 175, 97, ${farAlpha})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScrollCapture, { capture: true });
      window.removeEventListener('wheel', handleWheelCapture);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.92 }}
    />
  );
};

/**
 * 3D WIREFRAME GEOMETRIC EMBLEM (CSS 3D Cube / Astrolabe / Octahedron)
 * Continuously spins in 3D space on each monument card and accelerates on card hover
 */
export const Wireframe3DEmblem: React.FC<{
  accentHex?: string;
  variant?: 'cube' | 'astrolabe' | 'octahedron';
}> = ({ accentHex = '#C5A059', variant = 'astrolabe' }) => {
  return (
    <div
      aria-hidden="true"
      className="wireframe-3d-emblem-scene shrink-0 select-none pointer-events-none"
      title="3D Spatial Heritage Emblem"
    >
      <div className="wireframe-3d-emblem-rotor">
        {/* Outer Orbital Meridian Ring */}
        <span
          className="wireframe-3d-ring ring-x"
          style={{ borderColor: `${accentHex}88` }}
        />
        {/* Perpendicular Equatorial Ring */}
        <span
          className="wireframe-3d-ring ring-y"
          style={{ borderColor: `${accentHex}77` }}
        />
        {/* Diagonal Astrolabe Ring */}
        <span
          className="wireframe-3d-ring ring-diag"
          style={{ borderColor: `${accentHex}66` }}
        />
        {/* Inner 3D Wireframe Cube / Octahedron Faces */}
        <span
          className={`wireframe-3d-face face-front ${variant === 'octahedron' ? 'rotate-45' : ''}`}
          style={{ borderColor: accentHex }}
        />
        <span
          className={`wireframe-3d-face face-back ${variant === 'octahedron' ? 'rotate-45' : ''}`}
          style={{ borderColor: accentHex }}
        />
        <span
          className="wireframe-3d-core-dot"
          style={{ backgroundColor: accentHex }}
        />
      </div>
    </div>
  );
};

/**
 * 3D TEXT FLIP / ROLL ON HOVER (rotateX(90deg) dual-plane text roll)
 */
export const Flip3DText: React.FC<{
  text: string;
  active?: boolean;
  className?: string;
}> = ({ text, active = false, className = '' }) => {
  return (
    <span className={`flip-3d-text-wrapper ${className}`}>
      <span className="flip-3d-text-inner">
        <span className="flip-3d-text-front">{text}</span>
        <span
          className={`flip-3d-text-top ${
            active ? 'text-[#C5A059]' : 'text-[#C5A059]'
          }`}
          aria-hidden="true"
        >
          {text}
        </span>
      </span>
    </span>
  );
};
