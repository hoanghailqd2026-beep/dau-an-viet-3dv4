import React, { useEffect, useRef, useState } from 'react';

interface CascadeRevealCardProps {
  index: number;
  columnsPerRow?: number;
  delayStepMs?: number;
  maxDelayMs?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scroll-triggered museum cascade fade-in wrapper.
 * Wraps each heritage card cleanly so entrance translateY/opacity never conflicts
 * with inner 3D tilt hover transforms.
 */
export const CascadeRevealCard: React.FC<CascadeRevealCardProps> = ({
  index,
  columnsPerRow = 3,
  delayStepMs = 80,
  maxDelayMs = 320,
  className = '',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px 0px -24px 0px',
        threshold: 0.06,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  const staggerSlot = columnsPerRow > 1 ? index % columnsPerRow : Math.min(index, 4);
  const delayMs = Math.min(staggerSlot * delayStepMs, maxDelayMs);

  return (
    <div
      ref={containerRef}
      style={{ transitionDelay: isVisible ? `${delayMs}ms` : '0ms' }}
      className={`museum-cascade-item ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default CascadeRevealCard;
