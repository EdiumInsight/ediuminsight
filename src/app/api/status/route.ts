export async function GET() {
  return Response.json({
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    publicSources: [
      { name: "Nasdaq", purpose: "US exchange quotes and summary statistics", route: "/api/market?tickers=MSFT" },
      { name: "SEC EDGAR", purpose: "Issuer directory, XBRL financial facts, filings", route: "/api/analysis/MSFT" },
      { name: "Google News RSS", purpose: "Linked headlines with publisher attribution", route: "/api/news?tickers=MSFT" },
    ],
    aiProvider: false,
    checkedAt: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}