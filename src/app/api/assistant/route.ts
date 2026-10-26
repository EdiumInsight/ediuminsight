import { z } from "zod";

const requestSchema = z.object({
  task: z.enum(["BULL_CASE", "BEAR_CASE", "VALUATION", "RISKS", "CATALYSTS", "PORTFOLIO_REVIEW"]),
  ticker: z.string().trim().regex(/^[A-Z0-9.-]{1,12}$/).optional(),
  context: z.string().max(12_000),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid assistant request", details: parsed.error.flatten() }, { status: 400 });
  return Response.json({
    error: "No AI provider is configured. Add a server-side provider implementation before enabling generated investment research.",
    code: "AI_PROVIDER_UNAVAILABLE",
    request: { task: parsed.data.task, ticker: parsed.data.ticker ?? null },
  }, { status: 503 });
}