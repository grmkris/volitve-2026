import { formatPercent } from "@/lib/data/format"

interface TurnoutGaugeProps {
  percentage: number // 0-1
  size?: number
  className?: string
}

export function TurnoutGauge({
  percentage,
  size = 160,
  className,
}: TurnoutGaugeProps) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percentage)

  return (
    <div className={className}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-primary"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground font-heading text-2xl font-bold"
        >
          {formatPercent(percentage)}
        </text>
      </svg>
    </div>
  )
}
