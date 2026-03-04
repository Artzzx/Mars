import clsx from 'clsx';

interface SkeletonCardProps {
  className?: string;
  lines?: number;    // number of text skeleton lines to render (default 3)
  height?: string;   // override fixed height instead of text lines
}

export function SkeletonCard({ className, lines = 3, height }: SkeletonCardProps) {
  return (
    <div className={clsx('card p-4 animate-pulse', className)}>
      {height ? (
        <div className="rounded bg-le-border" style={{ height }} />
      ) : (
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-le-border" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                'h-3 rounded bg-le-border',
                i === lines - 2 ? 'w-1/2' : 'w-full',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
