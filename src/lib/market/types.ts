export type MarketQuote = {
  ticker: string;
  companyName: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  observedAt: string | null;
  isRealtime: boolean | null;
  marketStatus: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  oneYearTarget: number | null;
  dividendYield: number | null;
  fiftyTwoWeekRange: string | null;
  source: { name: string; url: string };
  error?: string;
};

export type AnnualFinancial = {
  fiscalYear: number;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;
  dilutedEps: number | null;
  shareholdersEquity: number | null;
  cash: number | null;
  debt: number | null;
  sharesOutstanding: number | null;
  source: string;
};

export type MarketNewsItem = {
  ticker: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string | null;
  summary: string | null;
  category: "NEWS" | "SEC FILING";
};