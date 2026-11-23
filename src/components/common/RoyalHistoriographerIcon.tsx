import React from 'react';

interface RoyalHistoriographerIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Minimalist archival emblem representing "Sử Quan Dấu Ấn" (Royal Historiographer / 史官讲解):
 * an unrolled imperial chronicle scroll with a vermilion/gold square seal stamp
 * paired with a slanted calligraphy brush.
 */
export const RoyalHistoriographerIcon: React.FC<RoyalHistoriographerIconProps> = ({
  className = 'w-[18px] h-[18px] text-[#C9A46A] shrink-0',
  size = 18,
  strokeWidth = 1.6,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Top scroll roller */}
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h11A1.5 1.5 0 0 1 18 5.5 1.5 1.5 0 0 1 16.5 7h-11A1.5 1.5 0 0 1 4 5.5Z" />
      {/* Unrolled chronicle parchment */}
      <path d="M6 7v11.5A1.5 1.5 0 0 0 7.5 20H11" />
      <path d="M16 7v2.8" />
      {/* Bottom scroll roller stub */}
      <path d="M4.5 18.5A1.5 1.5 0 0 1 6 17" />
      {/* Archival chronicle script lines */}
      <path d="M8.8 10.3h4.4" />
      <path d="M8.8 13.2h2.8" />
      {/* Square imperial seal stamp */}
      <rect x="8.8" y="15.6" width="2.2" height="2.2" rx="0.3" />
      {/* Slanted calligraphy brush */}
      <path d="M19.8 11.4a1.45 1.45 0 0 1 0 2.05l-4.15 4.15-2.75.9.9-2.75 4.15-4.15a1.45 1.45 0 0 1 1.85-.2Z" />
    </svg>
  );
};

export default RoyalHistoriographerIcon;
