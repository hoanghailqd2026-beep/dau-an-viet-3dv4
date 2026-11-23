import React from 'react';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';

interface DragScrollRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Horizontal overflow container with Heritage bronze-gold scrollbar,
 * native touch swipe, and mouse drag-to-scroll support.
 */
export const DragScrollRow: React.FC<DragScrollRowProps> = ({
  children,
  className = '',
  onMouseDown,
  onClickCapture,
  ...rest
}) => {
  const drag = useHorizontalDragScroll<HTMLDivElement>();

  return (
    <div
      {...rest}
      ref={drag.ref}
      onMouseDown={(e) => {
        drag.onMouseDown(e);
        onMouseDown?.(e);
      }}
      onClickCapture={(e) => {
        drag.onClickCapture(e);
        onClickCapture?.(e);
      }}
      className={`touch-pan-x select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
};
