import type { PartyId, CategoryId } from "@/lib/data/ids"
import type { TrackedPromise, PromiseCategory, Party } from "@/lib/data/types"

import { PromiseCard } from "./promise-card"

interface PromiseListProps {
  promises: TrackedPromise[]
  partyMap: Map<PartyId, Party>
  categoryMap: Map<CategoryId, PromiseCategory>
  showParty?: boolean
}

export function PromiseList({
  promises,
  partyMap,
  categoryMap,
  showParty = true,
}: PromiseListProps) {
  if (promises.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ni obvez za prikaz.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {promises.map((promise) => {
        const party = partyMap.get(promise.partyId)
        const category = categoryMap.get(promise.categoryId)
        return (
          <PromiseCard
            key={promise.id}
            promise={promise}
            partyColor={party?.color ?? "#888"}
            partyAbbrev={party?.abbrev ?? "?"}
            categoryName={category?.name ?? ""}
            showParty={showParty}
          />
        )
      })}
    </div>
  )
}
