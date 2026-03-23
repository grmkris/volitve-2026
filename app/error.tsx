"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="font-heading text-lg font-semibold">
        Prišlo je do napake
      </h2>
      <p className="max-w-md text-xs text-muted-foreground">
        {error.message || "Nepričakovana napaka pri nalaganju strani."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80"
      >
        Poskusi znova
      </button>
    </div>
  )
}
