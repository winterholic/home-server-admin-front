import clsx from 'clsx';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'glass-card rounded-xl',
        hover && 'hover:border-primary/30 transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}
