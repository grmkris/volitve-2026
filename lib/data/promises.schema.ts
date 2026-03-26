import { z } from "zod"

export const PROMISE_STATUSES = [
  "not_started",
  "in_progress",
  "fulfilled",
  "broken",
] as const
export const PromiseStatusSchema = z.enum(PROMISE_STATUSES)

export const PROMISE_SOURCES = ["party", "coalition"] as const
export const PromiseSourceSchema = z.enum(PROMISE_SOURCES)

const PromiseEvidenceSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1),
  date: z.string().date(),
})

const PromiseStatusChangeSchema = z.object({
  status: PromiseStatusSchema,
  date: z.string().date(),
  note: z.string().optional(),
  evidence: z.array(PromiseEvidenceSchema).optional(),
})

const TrackedPromiseSchema = z.object({
  id: z.string().min(1),
  partyId: z.number(),
  categoryId: z.string().min(1),
  source: PromiseSourceSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  currentStatus: PromiseStatusSchema,
  history: z.array(PromiseStatusChangeSchema),
  programRef: z.string().optional(),
  coalitionRef: z.string().optional(),
})

const PromiseCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
})

export const PromiseDataSchema = z.object({
  lastUpdated: z.string().datetime(),
  categories: z.array(PromiseCategorySchema),
  promises: z.array(TrackedPromiseSchema),
})
