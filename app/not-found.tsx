import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="font-heading text-lg font-semibold">
        Stran ni najdena
      </h2>
      <p className="max-w-md text-xs text-muted-foreground">
        Iskana stran ne obstaja ali je bila odstranjena.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80"
      >
        Nazaj na pregled
      </Link>
    </div>
  )
}
