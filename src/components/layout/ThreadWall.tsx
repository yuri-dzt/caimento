import { cn } from '../../utils/cn'

const THREADS = [
  'thread-stitch',
  'thread-sky',
  'thread-flax',
  'thread-violet',
  'thread-teal',
  'thread-rose',
  'thread-orange',
  'thread-moss',
  'thread-lilac',
  'thread-indigo',
  'thread-blush',
  'thread-plum',
]

function colorVar(name: string): string {
  return name === 'thread-stitch' ? 'hsl(var(--stitch))' : `hsl(var(--${name}))`
}

/** Expositor de carretéis do armarinho (ilustração do login) */
export function ThreadWall({ rows = 5, columns = 9, className }: { rows?: number; columns?: number; className?: string }) {
  const width = columns * 40
  const height = rows * 64

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-auto w-full', className)} aria-hidden="true">
      <defs>
        <pattern id="peg" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.6" fill="hsl(0 0% 100% / 0.14)" />
        </pattern>
        <pattern id="wind" width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="hsl(0 0% 0% / 0.18)" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#peg)" />
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => {
          const index = (row * 5 + column * 7) % THREADS.length
          const x = column * 40 + 8
          const y = row * 64 + 8
          // alguns carretéis mais vazios, como numa parede de verdade
          const fill = [1, 0.8, 0.62, 0.9, 1, 0.72][(row + column) % 6]
          const bodyWidth = 16 * fill
          return (
            <g key={`${row}-${column}`}>
              <rect x={x + 11} y={y - 4} width="2" height="6" fill="hsl(0 0% 100% / 0.35)" rx="1" />
              <rect x={x} y={y} width="24" height="5" rx="1.5" fill="hsl(var(--spool-cap))" />
              <rect x={x} y={y + 43} width="24" height="5" rx="1.5" fill="hsl(var(--spool-cap))" />
              <rect x={x + 5} y={y + 5} width="14" height="38" fill="hsl(var(--spool-core))" />
              <rect x={x + 12 - bodyWidth / 2} y={y + 5} width={bodyWidth} height="38" fill={colorVar(THREADS[index])} />
              <rect x={x + 12 - bodyWidth / 2} y={y + 5} width={bodyWidth} height="38" fill="url(#wind)" />
            </g>
          )
        }),
      )}
    </svg>
  )
}
