import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '../../components/ui/utils.js';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function InfoTip({ label = 'More information', tone = 'info', children, className }) {
  const Icon = tone === 'warning' ? AlertCircle : Info;
  const toneClass = tone === 'warning' ? 'text-amber-600 hover:text-amber-700' : 'text-slate-500 hover:text-slate-900';
  const buttonRef = useRef(null);
  const bubbleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || typeof window === 'undefined') return undefined;

    function updatePosition() {
      const rect = buttonRef.current.getBoundingClientRect();
      const bubbleWidth = Math.min(320, window.innerWidth - 24);
      const bubbleHeight = bubbleRef.current?.offsetHeight ?? 120;
      const preferredTop = rect.bottom + 8;
      const fallbackTop = rect.top - bubbleHeight - 8;
      const top = preferredTop + bubbleHeight <= window.innerHeight - 12 ? preferredTop : fallbackTop;
      const left = clamp(rect.right - bubbleWidth, 12, window.innerWidth - bubbleWidth - 12);
      setPosition({ top: clamp(top, 12, Math.max(12, window.innerHeight - bubbleHeight - 12)), left });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const bubble = open && typeof document !== 'undefined'
    ? createPortal(
        <span
          ref={bubbleRef}
          className="pointer-events-none fixed z-[1000] w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs leading-5 text-slate-600 shadow-2xl"
          style={{ top: position.top, left: position.left }}
        >
          {children}
        </span>,
        document.body,
      )
    : null;

  return (
    <span className={cn('relative inline-flex', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn('rounded-full border border-slate-200 bg-white p-1', toneClass)}
        aria-label={label}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Icon className="h-4 w-4" />
      </button>
      {bubble}
    </span>
  );
}
