import { getCompanyFinancials } from "@/lib/market/sec";

export async function GET(_request: Request, context: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await context.params;
  if (!/^[A-Za-z0-9.-]{1,12}$/.test(ticker)) return Response.json({ error: "Invalid ticker" }, { status: 400 });
  try {
    const result = await getCompanyFinancials(ticker);
    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "SEC EDGAR data unavailable" }, { status: 502 });
  }
}