import clsx from 'clsx';

const severityStyles = {
  critical: 'bg-red-500 text-white',
  error: 'bg-red-500/20 text-red-400',
  warning: 'bg-yellow-500 text-gray-900',
  info: 'bg-primary/20 text-primary',
};

export default function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'error' | 'critical' }) {
  return (
    <span
      className={clsx(
        'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
        severityStyles[severity]
      )}
    >
      {severity}
    </span>
  );
}
