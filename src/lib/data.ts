export type Holding = {
  ticker: string;
  company: string;
  shares: number;
  price: number;
  change: number;
  value: number;
  weight: number;
  sector: string;
};

export const holdings: Holding[] = [
  { ticker: "MSFT", company: "Microsoft Corp.", shares: 42, price: 428.76, change: 1.28, value: 18007.92, weight: 18.7, sector: "Technology" },
  { ticker: "NVDA", company: "NVIDIA Corp.", shares: 65, price: 137.49, change: 2.84, value: 8936.85, weight: 9.3, sector: "Semiconductors" },
  { ticker: "BRK.B", company: "Berkshire Hathaway", shares: 18, price: 482.15, change: 0.42, value: 8678.70, weight: 9.0, sector: "Financials" },
  { ticker: "V", company: "Visa Inc.", shares: 26, price: 352.08, change: -0.37, value: 9143.94, weight: 9.5, sector: "Financials" },
  { ticker: "COST", company: "Costco Wholesale", shares: 9, price: 1008.41, change: 0.91, value: 9075.69, weight: 9.4, sector: "Consumer" },
  { ticker: "AMZN", company: "Amazon.com Inc.", shares: 44, price: 228.93, change: 1.62, value: 10072.92, weight: 10.5, sector: "Consumer" },
  { ticker: "GOOGL", company: "Alphabet Inc.", shares: 50, price: 191.42, change: 0.76, value: 9571.00, weight: 9.9, sector: "Communication" },
  { ticker: "LLY", company: "Eli Lilly and Co.", shares: 12, price: 814.25, change: -1.15, value: 9771.00, weight: 10.1, sector: "Healthcare" },
];

export const portfolioHistory = [
  { date: "Nov 25", portfolio: 78, benchmark: 75 }, { date: "Dec 02", portfolio: 79, benchmark: 76 },
  { date: "Dec 09", portfolio: 77, benchmark: 76.5 }, { date: "Dec 16", portfolio: 82, benchmark: 78 },
  { date: "Dec 23", portfolio: 84, benchmark: 79 }, { date: "Dec 30", portfolio: 83, benchmark: 80 },
  { date: "Jan 06", portfolio: 88, benchmark: 81 }, { date: "Jan 13", portfolio: 86, benchmark: 82 },
  { date: "Jan 20", portfolio: 91, benchmark: 83 }, { date: "Jan 27", portfolio: 94, benchmark: 84 },
  { date: "Feb 03", portfolio: 92, benchmark: 84.5 }, { date: "Feb 10", portfolio: 97, benchmark: 86 },
];

export const allocation = [
  { name: "Technology", value: 34, color: "#75a9f9" },
  { name: "Consumer", value: 20, color: "#43c99a" },
  { name: "Financials", value: 19, color: "#e9b44c" },
  { name: "Healthcare", value: 12, color: "#d58ac6" },
  { name: "Other", value: 15, color: "#8290a2" },
];

export const newsItems = [
  { ticker: "MSFT", title: "Microsoft expands capacity for its next generation of AI infrastructure", source: "Reuters", time: "18 min ago", sentiment: "Bullish" },
  { ticker: "NVDA", title: "Chip demand outlook remains robust as cloud investment accelerates", source: "MarketWatch", time: "42 min ago", sentiment: "Bullish" },
  { ticker: "LLY", title: "Eli Lilly outlines expanded manufacturing investment for 2026", source: "Company filing", time: "1 hr ago", sentiment: "Neutral" },
];

export const watchlistMovers = [
  { ticker: "ASML", company: "ASML Holding", price: "$742.60", change: "+3.42%" },
  { ticker: "ADBE", company: "Adobe Inc.", price: "$438.22", change: "+2.17%" },
  { ticker: "UNH", company: "UnitedHealth Group", price: "$512.80", change: "-1.86%" },
];

export const formatCurrency = (value: number, digits = 0) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits,
}).format(value);