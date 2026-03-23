import Link from "next/link"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
}

export function PageHeader({ title, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Desktop breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Navigacija"
          className="mb-2 hidden items-center gap-1 text-xs text-muted-foreground md:flex"
        >
          <Link href="/" className="hover:text-foreground">
            Domov
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <CaretRight className="size-3" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Mobile: back link + title */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2 md:hidden">
          <Link
            href={
              breadcrumbs.length > 1
                ? (breadcrumbs[breadcrumbs.length - 2].href ?? "/")
                : "/"
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Nazaj
          </Link>
        </div>
      )}

      <h1 className="font-heading text-xl font-bold md:text-3xl">{title}</h1>
    </div>
  )
}
