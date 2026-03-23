import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 pb-20 md:pb-0">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p>
              Podatki:{" "}
              <a
                href="https://volitve.dvk-rs.si/dz2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                DVK
              </a>
              {" · "}
              Meje:{" "}
              <a
                href="https://github.com/stefanb/gurs-rpe"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                GURS RPE
              </a>{" "}
              (CC-BY 4.0)
            </p>
          </div>
          <div>
            <Link
              href="/o-projektu"
              className="underline underline-offset-2 hover:text-foreground"
            >
              O projektu
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
