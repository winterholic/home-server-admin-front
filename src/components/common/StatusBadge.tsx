import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'failed' | 'healthy' | 'warning' | 'critical' | 'info' | 'error' | 'unknown';
  label?: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  healthy: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-slate-700/50 text-slate-500 border-slate-600/50',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  unknown: 'bg-slate-700/50 text-slate-500 border-slate-600/50',
};

const dotStyles: Record<string, string> = {
  active: 'bg-green-500',
  healthy: 'bg-green-500',
  inactive: 'bg-slate-600',
  failed: 'bg-red-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
  info: 'bg-slate-400',
  error: 'bg-red-500',
  unknown: 'bg-slate-600',
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
        statusStyles[status]
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[status], status === 'active' && 'animate-pulse')} />
      {label || status}
    </span>
  );
}
