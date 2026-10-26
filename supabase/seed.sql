insert into public.financials (company_id, fiscal_year, period, revenue, gross_profit, operating_income, net_income, free_cash_flow, eps, book_value, cash, debt, capex, data_source)
select company.id, sample.fiscal_year, 'FY', sample.revenue, sample.gross_profit, sample.operating_income, sample.net_income, sample.free_cash_flow, sample.eps, null, null, null, null, 'illustrative_seed'
from public.companies as company
cross join (values
  (2015, 93.6, 60.5, 18.2, 12.2, 23.8, 1.49),
  (2016, 91.2, 58.4, 21.2, 16.8, 24.3, 2.10),
  (2017, 96.6, 62.3, 22.3, 25.5, 31.0, 3.25),
  (2018, 110.4, 72.0, 35.1, 16.6, 32.3, 2.13),
  (2019, 125.8, 82.9, 42.9, 39.2, 38.3, 5.06),
  (2020, 143.0, 96.9, 52.9, 44.3, 45.2, 5.76),
  (2021, 168.1, 115.9, 69.9, 61.3, 56.1, 8.05),
  (2022, 198.3, 135.6, 83.4, 72.7, 65.1, 9.65),
  (2023, 211.9, 146.1, 88.5, 72.4, 59.5, 9.68),
  (2024, 245.1, 171.0, 109.4, 88.1, 74.1, 11.80)
) as sample(fiscal_year, revenue, gross_profit, operating_income, net_income, free_cash_flow, eps)
where company.ticker = 'MSFT'
on conflict (company_id, fiscal_year, period) do nothing;