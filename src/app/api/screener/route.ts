import { getNasdaqQuote } from "@/lib/market/nasdaq";
import { getCompanyFinancials } from "@/lib/market/sec";

const universe = ["MSFT", "NVDA", "GOOGL", "AMZN", "V", "LLY", "COST", "BRK.B"];

export async function GET() {
  const results = await Promise.all(universe.map(async (ticker) => {
    const [financialResult, quote] = await Promise.allSettled([getCompanyFinancials(ticker), getNasdaqQuote(ticker)]);
    if (financialResult.status === "rejected") return { ticker, company: ticker, error: "SEC annual financials unavailable" };
    const financials = financialResult.value.financials;
    const latest = financials.at(-1);
    const previous = financials.at(-2);
    if (!latest) return { ticker, company: financialResult.value.company.name, error: "No annual SEC financial data reported" };
    const latestQuote = quote.status === "fulfilled" ? quote.value : null;
    const revenueGrowth = latest.revenue !== null && previous?.revenue ? latest.revenue / previous.revenue - 1 : null;
    const fcfMargin = latest.freeCashFlow !== null && latest.revenue ? latest.freeCashFlow / latest.revenue : null;
    const annualPe = latestQuote?.marketCap && latest.netIncome && latest.netIncome > 0 ? latestQuote.marketCap / latest.netIncome : null;
    const netCash = latest.cash !== null && latest.debt !== null ? latest.cash - latest.debt : null;
    return {
      ticker,
      company: financialResult.value.company.name,
      price: latestQuote?.price ?? null,
      marketCap: latestQuote?.marketCap ?? null,
      revenueGrowth,
      fcfMargin,
      annualPe,
      netCash,
      returnOnInvestedCapital: null,
      maxDrawdown: null,
      reportedFiscalYear: latest.fiscalYear,
      revenueGrowthFiscalYear: previous?.fiscalYear ?? null,
      priceObservedAt: latestQuote?.observedAt ?? null,
      sources: [financialResult.value.source.name, ...(latestQuote ? [latestQuote.source.name] : [])],
      ...(latestQuote?.error ? { quoteWarning: latestQuote.error } : {}),
    };
  }));
  return Response.json({ data: results, universe: "Large-cap US listed issuers", fetchedAt: new Date().toISOString(), limitations: ["ROIC and maximum drawdown are omitted because selected free sources do not provide consistently comparable values.", "P/E uses the latest SEC-reported annual net income, not forward earnings; fiscal-year labels are shown."] }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" } });
}