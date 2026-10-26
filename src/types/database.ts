export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamped = { id: string; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      users: Table<Timestamped & { email: string; full_name: string | null; avatar_url: string | null }>;
      portfolios: Table<Timestamped & { user_id: string; name: string; base_currency: string }>;
      holdings: Table<Timestamped & { portfolio_id: string; company_id: string; shares: number; average_cost: number }>;
      transactions: Table<Timestamped & { portfolio_id: string; company_id: string | null; type: "BUY" | "SELL" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL"; shares: number | null; price: number | null; amount: number; transacted_at: string }>;
      watchlists: Table<Timestamped & { user_id: string; name: string; description: string | null }>;
      watchlist_items: Table<Timestamped & { watchlist_id: string; company_id: string; target_price: number | null; notes: string | null }>;
      companies: Table<Timestamped & { ticker: string; name: string; exchange: string | null; sector: string | null; industry: string | null; country: string | null; metadata: Json }>;
      financials: Table<Timestamped & { company_id: string; fiscal_year: number; period: string; revenue: number | null; gross_profit: number | null; operating_income: number | null; net_income: number | null; free_cash_flow: number | null; eps: number | null; book_value: number | null; cash: number | null; debt: number | null; capex: number | null }>;
      news: Table<Timestamped & { company_id: string | null; headline: string; source: string; url: string | null; summary: string | null; impact_analysis: string | null; sentiment: "BULLISH" | "NEUTRAL" | "BEARISH"; published_at: string }>;
      valuations: Table<Timestamped & { user_id: string; company_id: string; method: string; assumptions: Json; result: Json }>;
      theses: Table<Timestamped & { user_id: string; company_id: string; title: string; investment_thesis: string; catalysts: Json; risks: Json; invalidation_points: Json; probability: number; status: "ALIVE" | "AT_RISK" | "BROKEN" }>;
      thesis_events: Table<Timestamped & { thesis_id: string; user_id: string; event_type: string; content: string; previous_value: Json; next_value: Json }>;
      alerts: Table<Timestamped & { user_id: string; company_id: string | null; type: string; name: string; condition: Json; enabled: boolean; last_triggered_at: string | null }>;
      settings: Table<{ user_id: string; base_currency: string; timezone: string; preferences: Json; updated_at: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};