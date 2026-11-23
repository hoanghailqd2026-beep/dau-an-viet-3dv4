import React from 'react';

interface LockGlyphProps {
  className?: string;
  title?: string;
}

/**
 * Minimalist museum-grade SVG padlock icon (#C9A46A, strokeWidth 1.6).
 * Used consistently across all tier-gated controls (zero emojis).
 */
export const LockGlyph: React.FC<LockGlyphProps> = ({
  className = 'w-3.5 h-3.5 shrink-0',
  title,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
  >
    {title ? <title>{title}</title> : null}
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>
);
