import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const resources = ["portfolio", "holdings", "transactions", "analysis", "valuation", "news", "watchlists", "thesis", "alerts", "screener"] as const;
export type ApiResource = (typeof resources)[number];

const transactionType = z.enum(["BUY", "SELL", "DIVIDEND", "DEPOSIT", "WITHDRAWAL"]);
const schemas: Partial<Record<ApiResource, z.ZodType<Record<string, unknown>>>> = {
  portfolio: z.object({ name: z.string().trim().min(1).max(80), base_currency: z.string().length(3).default("USD") }).strict(),
  holdings: z.object({ portfolio_id: z.string().uuid(), company_id: z.string().uuid(), shares: z.number().positive(), average_cost: z.number().nonnegative() }).strict(),
  transactions: z.object({ portfolio_id: z.string().uuid(), company_id: z.string().uuid().nullable().optional(), type: transactionType, shares: z.number().nonnegative().nullable().optional(), price: z.number().nonnegative().nullable().optional(), amount: z.number().positive(), transacted_at: z.string().datetime() }).strict(),
  watchlists: z.object({ name: z.string().trim().min(1).max(80), description: z.string().max(500).nullable().optional() }).strict(),
  thesis: z.object({ company_id: z.string().uuid(), title: z.string().trim().min(1).max(120), investment_thesis: z.string().min(20).max(10_000), catalysts: z.array(z.string().max(500)).default([]), risks: z.array(z.string().max(500)).default([]), invalidation_points: z.array(z.string().max(500)).default([]), probability: z.number().min(0).max(100).default(50), status: z.enum(["ALIVE", "AT_RISK", "BROKEN"]).default("ALIVE") }).strict(),
  alerts: z.object({ company_id: z.string().uuid().nullable().optional(), type: z.enum(["PRICE", "NEWS", "FUNDAMENTAL", "THESIS"]), name: z.string().trim().min(1).max(120), condition: z.record(z.string(), z.unknown()), enabled: z.boolean().default(true) }).strict(),
  valuation: z.object({ company_id: z.string().uuid(), method: z.enum(["DCF", "MULTIPLE", "REVERSE_DCF"]), assumptions: z.record(z.string(), z.unknown()), result: z.record(z.string(), z.unknown()) }).strict(),
};

const tables: Record<ApiResource, keyof Database["public"]["Tables"]> = {
  portfolio: "portfolios", holdings: "holdings", transactions: "transactions", analysis: "financials",
  valuation: "valuations", news: "news", watchlists: "watchlists", thesis: "theses", alerts: "alerts", screener: "companies",
};

export function isApiResource(value: string): value is ApiResource {
  return resources.includes(value as ApiResource);
}

export async function listResource(resource: ApiResource) {
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Supabase is not configured", code: "DATABASE_UNAVAILABLE" }, { status: 503 });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return Response.json({ error: "Authentication required", code: "UNAUTHENTICATED" }, { status: 401 });
  const table = tables[resource];
  const query = client.from(table).select("*").limit(200);
  const { data, error } = await query;
  if (error) return Response.json({ error: "Unable to load resource", code: "QUERY_FAILED" }, { status: 500 });
  return Response.json({ data, count: data?.length ?? 0 });
}

export async function createResource(resource: ApiResource, request: Request) {
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Supabase is not configured", code: "DATABASE_UNAVAILABLE" }, { status: 503 });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return Response.json({ error: "Authentication required", code: "UNAUTHENTICATED" }, { status: 401 });
  const schema = schemas[resource];
  if (!schema) return Response.json({ error: "This resource is read-only", code: "READ_ONLY" }, { status: 405 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON", code: "INVALID_JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Request validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
  const payload = { ...parsed.data, ...(["portfolio", "watchlists", "thesis", "alerts", "valuation"].includes(resource) ? { user_id: user.id } : {}) };
  const table = tables[resource];
  const { data, error } = await client.from(table).insert(payload as never).select().single();
  if (error) return Response.json({ error: "Unable to create resource", code: "INSERT_FAILED" }, { status: 400 });
  return Response.json({ data }, { status: 201 });
}