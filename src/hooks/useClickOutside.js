import { useEffect } from 'react';

export function useClickOutside({ open, refs, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      const clickedInside = refs.some((ref) => ref.current?.contains(target));
      if (!clickedInside) onClose?.();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, refs, onClose]);
}
