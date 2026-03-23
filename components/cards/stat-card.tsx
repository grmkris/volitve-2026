import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  className?: string
}

export function StatCard({ label, value, sublabel, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-bold tabular-nums md:text-3xl">
        {value}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )
}
