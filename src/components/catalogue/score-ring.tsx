interface ScoreRingProps {
  score: number
  max?: number
}

/** Circular gauge used by the Catalogue Health card, e.g. "82 /100". */
export function ScoreRing({ score, max = 100 }: ScoreRingProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, Math.max(0, score / max))
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#16a34a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap">
        <p className="text-base leading-6 font-semibold text-foreground">{score}</p>
        <p className="text-xs leading-4 text-muted-foreground">/{max}</p>
      </div>
    </div>
  )
}
