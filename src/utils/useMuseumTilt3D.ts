import React, { useCallback } from 'react';

/**
 * Provides lightweight, zero-re-render 60fps physical 3D tilt (perspective: 1000px,
 * preserve-3d Z-depth separation) and cursor-tracked specular light sheen across ALL machines
 * regardless of OS prefers-reduced-motion settings.
 */
export function useMuseumTilt3D(maxDeg = 7) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));
      const normX = (x / rect.width) * 2 - 1; // -1 to 1
      const normY = (y / rect.height) * 2 - 1; // -1 to 1

      const rotateY = +(normX * maxDeg).toFixed(2);
      const rotateX = +(-normY * maxDeg).toFixed(2);
      const sheenAngle = Math.round(115 + normX * 35);

      card.setAttribute('data-tilting', 'true');
      card.style.transformStyle = 'preserve-3d';
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.018, 1.018, 1.018)`;

      const glowEl = card.querySelector<HTMLElement>('[data-tilt-glow="true"]');
      if (glowEl) {
        glowEl.style.opacity = '1';
        glowEl.style.background = `radial-gradient(360px circle at ${Math.round(x)}px ${Math.round(
          y
        )}px, rgba(255, 245, 222, 0.22), rgba(201, 164, 106, 0.14) 38%, transparent 72%), linear-gradient(${sheenAngle}deg, transparent ${Math.max(
          0,
          Math.round(pctX - 26)
        )}%, rgba(255, 250, 235, 0.14) ${Math.round(pctX)}%, transparent ${Math.min(
          100,
          Math.round(pctX + 26)
        )}%)`;
      }
      card.style.setProperty('--tilt-px', `${pctX.toFixed(1)}%`);
      card.style.setProperty('--tilt-py', `${pctY.toFixed(1)}%`);
    },
    [maxDeg]
  );

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    card.removeAttribute('data-tilting');
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    const glowEl = card.querySelector<HTMLElement>('[data-tilt-glow="true"]');
    if (glowEl) {
      glowEl.style.opacity = '0';
    }
  }, []);

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}

