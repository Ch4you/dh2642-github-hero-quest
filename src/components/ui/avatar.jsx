import { cn } from './utils.js';

export function Avatar({ className, children, ...props }) {
  return (
    <div className={cn('relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full', className)} {...props}>
      {children}
    </div>
  );
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-slate-900 text-sm font-semibold text-white', className)} {...props}>
      {children}
    </div>
  );
}

