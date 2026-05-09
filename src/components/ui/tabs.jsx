import { createContext, useContext } from 'react';
import { cn } from './utils.js';

const TabsContext = createContext(null);

export function Tabs({ value, onValueChange, children }) {
  return <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, ...props }) {
  return <div className={cn('inline-flex items-center gap-2 p-1 bg-white shadow-sm rounded-2xl', className)} {...props} />;
}

export function TabsTrigger({ value, className, ...props }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs');
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange?.(value)}
      className={cn(
        'px-3 py-1.5 text-sm rounded-xl transition',
        active ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' : 'text-slate-700 hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  );
}

