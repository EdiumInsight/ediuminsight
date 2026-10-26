import type { AnnualFinancial } from "@/lib/market/types";

const SEC_BASE = "https://data.sec.gov";
const USER_AGENT = process.env.SEC_USER_AGENT || "Edium Insight contact admin@example.com";

type TickerEntry = { cik_str: number; ticker: string; title: string };
type Observation = { fy?: number; fp?: string; form?: string; filed?: string; end?: string; start?: string; val?: number };
type Fact = { label?: string; units?: Record<string, Observation[]> };
type CompanyFacts = { cik: number; entityName: string; facts: { "us-gaap"?: Record<string, Fact>; dei?: Record<string, Fact> } };
type CompanySubmissions = {
  cik: string;
  name: string;
  filings: { recent: { form: string[]; filingDate: string[]; accessionNumber: string[]; primaryDocument: string[]; primaryDocDescription?: string[] } };
};

async function secJson<T>(url: string): Promise<T> {
  const isCompanyFacts = url.includes("/api/xbrl/companyfacts/");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    ...(isCompanyFacts ? { cache: "no-store" as const } : { next: { revalidate: 86_400 } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`SEC EDGAR returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getSecCompany(ticker: string) {
  const directory = await secJson<Record<string, TickerEntry>>("https://www.sec.gov/files/company_tickers.json");
  const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const entry = Object.values(directory).find((company) => normalize(company.ticker) === normalize(ticker));
  if (!entry) throw new Error(`Ticker ${ticker.toUpperCase()} was not found in SEC EDGAR.`);
  return { cik: String(entry.cik_str).padStart(10, "0"), ticker: entry.ticker, name: entry.title };
}

function annualObservations(fact: Fact | undefined, unit: string, duration: boolean) {
  const observations = fact?.units?.[unit] ?? [];
  const valid = observations.filter((item) => {
    if (item.form !== "10-K" && item.form !== "10-K/A") return false;
    if (item.fp !== "FY" || !item.end) return false;
    if (duration !== Boolean(item.start)) return false;
    if (duration && item.start) {
      const days = (Date.parse(item.end) - Date.parse(item.start)) / 86_400_000;
      if (days < 330 || days > 380) return false;
    }
    return Number.isFinite(item.val);
  });
  const byYear = new Map<number, Observation>();
  for (const observation of valid) {
    const fiscalYear = new Date(`${observation.end}T00:00:00Z`).getUTCFullYear();
    const previous = byYear.get(fiscalYear);
    if (!previous || `${observation.filed}` > `${previous.filed}`) byYear.set(fiscalYear, observation);
  }
  return byYear;
}

function metricSeries(facts: Record<string, Fact>, tags: string[], unit: string, duration: boolean) {
  let latestSeries = new Map<number, Observation>();
  let latestYear = -Infinity;
  for (const tag of tags) {
    const series = annualObservations(facts[tag], unit, duration);
    const years = [...series.keys()];
    const maxYear = Math.max(...years);
    if (years.length && maxYear > latestYear) {
      latestSeries = series;
      latestYear = maxYear;
    }
  }
  return latestSeries;
}

function valueFor(series: Map<number, Observation>, fiscalYear: number) {
  const value = series.get(fiscalYear)?.val;
  return typeof value === "number" ? value : null;
}

export async function getCompanyFinancials(ticker: string) {
  const company = await getSecCompany(ticker);
  const cikNumber = Number(company.cik);
  const factsResponse = await secJson<CompanyFacts>(`${SEC_BASE}/api/xbrl/companyfacts/CIK${company.cik}.json`);
  const facts = factsResponse.facts["us-gaap"] ?? {};
  const revenue = metricSeries(facts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "RevenueFromContractWithCustomerIncludingAssessedTax", "Revenues", "SalesRevenueNet", "SalesRevenueGoodsNet"], "USD", true);
  const grossProfit = metricSeries(facts, ["GrossProfit"], "USD", true);
  const operatingIncome = metricSeries(facts, ["OperatingIncomeLoss"], "USD", true);
  const netIncome = metricSeries(facts, ["NetIncomeLoss", "ProfitLoss"], "USD", true);
  const incomeBeforeTax = metricSeries(facts, ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItems"], "USD", true);
  const incomeTaxExpense = metricSeries(facts, ["IncomeTaxExpenseBenefit"], "USD", true);
  const operatingCashFlow = metricSeries(facts, ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"], "USD", true);
  const capitalExpenditures = metricSeries(facts, ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquirePropertyPlantAndEquipmentAndIntangibleAssets", "PaymentsToAcquireProductiveAssets"], "USD", true);
  const dilutedEps = metricSeries(facts, ["EarningsPerShareDiluted"], "USD/shares", true);
  const shareholdersEquity = metricSeries(facts, ["StockholdersEquity"], "USD", false);
  const cash = metricSeries(facts, ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"], "USD", false);
  const totalDebt = metricSeries(facts, ["LongTermDebtAndFinanceLeaseObligationsCurrentAndNoncurrent", "LongTermDebtAndCapitalLeaseObligations"], "USD", false);
  const currentDebt = metricSeries(facts, ["LongTermDebtCurrent", "LongTermDebtAndFinanceLeaseObligationsCurrent", "ShortTermBorrowings"], "USD", false);
  const longTermDebt = metricSeries(facts, ["LongTermDebtNoncurrent", "LongTermDebtAndFinanceLeaseObligationsNoncurrent", "LongTermDebt"], "USD", false);
  const sharesOutstanding = metricSeries({ ...facts, ...(factsResponse.facts.dei ?? {}) }, ["EntityCommonStockSharesOutstanding", "CommonStockSharesOutstanding"], "shares", false);

  const years = [...revenue.keys()].sort((a, b) => a - b).slice(-10);
  const annual: AnnualFinancial[] = years.map((fiscalYear) => {
    const opCash = valueFor(operatingCashFlow, fiscalYear);
    const capex = valueFor(capitalExpenditures, fiscalYear);
    const directDebt = valueFor(totalDebt, fiscalYear);
    const componentDebt = valueFor(currentDebt, fiscalYear);
    const longDebt = valueFor(longTermDebt, fiscalYear);
    return {
      fiscalYear,
      revenue: valueFor(revenue, fiscalYear),
      grossProfit: valueFor(grossProfit, fiscalYear),
      operatingIncome: valueFor(operatingIncome, fiscalYear),
      netIncome: valueFor(netIncome, fiscalYear),
      incomeBeforeTax: valueFor(incomeBeforeTax, fiscalYear),
      incomeTaxExpense: valueFor(incomeTaxExpense, fiscalYear),
      operatingCashFlow: opCash,
      capitalExpenditures: capex,
      freeCashFlow: opCash !== null && capex !== null ? opCash - capex : null,
      dilutedEps: valueFor(dilutedEps, fiscalYear),
      shareholdersEquity: valueFor(shareholdersEquity, fiscalYear),
      cash: valueFor(cash, fiscalYear),
      debt: directDebt ?? (componentDebt !== null || longDebt !== null ? (componentDebt ?? 0) + (longDebt ?? 0) : null),
      sharesOutstanding: valueFor(sharesOutstanding, fiscalYear),
      source: `SEC EDGAR companyfacts CIK ${String(cikNumber).padStart(10, "0")}`,
    };
  });
  return {
    company,
    financials: annual,
    source: { name: "SEC EDGAR XBRL", url: `${SEC_BASE}/api/xbrl/companyfacts/CIK${company.cik}.json` },
    caveats: ["Reported GAAP facts; fiscal years and units follow each issuer's SEC filings.", "Free cash flow is calculated as operating cash flow minus purchases of property and equipment when both facts are reported."],
  };
}

export async function getRecentSecFilings(ticker: string, limit = 5) {
  const company = await getSecCompany(ticker);
  const submissions = await secJson<CompanySubmissions>(`${SEC_BASE}/submissions/CIK${company.cik}.json`);
  const recent = submissions.filings.recent;
  return recent.form.flatMap((form, index) => {
    if (!["8-K", "10-Q", "10-K", "6-K", "20-F"].includes(form)) return [];
    const accession = recent.accessionNumber[index]?.replaceAll("-", "");
    const document = recent.primaryDocument[index];
    if (!accession || !document) return [];
    const url = `https://www.sec.gov/Archives/edgar/data/${Number(company.cik)}/${accession}/${document}`;
    return [{ ticker: company.ticker, headline: `${form}: ${recent.primaryDocDescription?.[index] || company.name + " filing"}`, source: "SEC EDGAR", url, publishedAt: recent.filingDate[index], summary: null, category: "SEC FILING" as const }];
  }).slice(0, limit);
}