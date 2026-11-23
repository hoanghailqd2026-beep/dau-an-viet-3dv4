import React, { useCallback, useRef } from 'react';

export interface HorizontalDragScrollBindings<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>;
  onMouseDown: React.MouseEventHandler<T>;
  onClickCapture: React.MouseEventHandler<T>;
}

/**
 * Enables smooth mouse drag-to-scroll on horizontal overflow containers
 * so both mobile touch swipe and desktop Mobile Preview mouse dragging work seamlessly.
 */
export function useHorizontalDragScroll<
  T extends HTMLElement = HTMLDivElement
>(): HorizontalDragScrollBindings<T> {
  const ref = useRef<T | null>(null);
  const draggedRef = useRef(false);

  const onMouseDown = useCallback<React.MouseEventHandler<T>>((e) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.getAttribute('role') === 'slider')
    ) {
      return;
    }

    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;

    const startX = e.clientX;
    const startScrollLeft = el.scrollLeft;
    draggedRef.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      if (Math.abs(dx) > 4) {
        draggedRef.current = true;
      }
      if (draggedRef.current) {
        moveEvent.preventDefault();
        el.scrollLeft = startScrollLeft - dx;
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (draggedRef.current) {
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 60);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp, { once: true });
  }, []);

  const onClickCapture = useCallback<React.MouseEventHandler<T>>((e) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  }, []);

  return { ref, onMouseDown, onClickCapture };
}
