import Parser from "rss-parser";
import type { MarketNewsItem } from "@/lib/market/types";

const parser = new Parser({ timeout: 10_000, headers: { "User-Agent": "EdiumInsight/1.0" }, customFields: { item: [["source", "publisher"]] } });

export async function getGoogleNews(ticker: string, limit = 5): Promise<MarketNewsItem[]> {
  const query = encodeURIComponent(`${ticker} stock company`);
  const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`);
  return (feed.items ?? []).slice(0, limit).flatMap((item) => {
    if (!item.title || !item.link) return [];
    const published = item.isoDate ?? item.pubDate;
    const parsedDate = published ? new Date(published) : null;
    return [{
      ticker: ticker.toUpperCase(),
      headline: item.title,
      source: (item as typeof item & { publisher?: string }).publisher ?? "Google News RSS",
      url: item.link,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      summary: item.contentSnippet?.trim() || null,
      category: "NEWS" as const,
    }];
  });
}