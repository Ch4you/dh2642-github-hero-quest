import { createContext, useContext, useEffect, useMemo } from 'react';
import { cn } from './utils.js';

const SheetContext = createContext(null);

export function Sheet({ open, onOpenChange, children }) {
  const value = useMemo(() => ({ open: !!open, onOpenChange }), [open, onOpenChange]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function SheetContent({ className, children, ...props }) {
  const ctx = useContext(SheetContext);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') ctx?.onOpenChange?.(false);
    }
    if (ctx?.open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctx]);

  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50" {...props}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => ctx.onOpenChange?.(false)} />
      <div className={cn('absolute right-0 top-0 h-full w-full max-w-full bg-white shadow-xl', className)}>{children}</div>
    </div>
  );
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 p-6', className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function SheetDescription({ className, ...props }) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />;
}

