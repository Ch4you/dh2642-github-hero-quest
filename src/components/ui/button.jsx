import { cn } from './utils.js';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-50 disabled:pointer-events-none';

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}) {
  const variantMap = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  }[variant];

  const sizeMap = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 py-2 text-xs',
    icon: 'h-10 w-10 p-0',
  }[size];

  return <button className={cn(base, variantMap, sizeMap, className)} {...props} />;
}

