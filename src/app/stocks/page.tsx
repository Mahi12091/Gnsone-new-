import { SiteShell, PageTitle, Card } from "@/components/site-shell";
import { StockSearch } from "@/components/stock-search";
import { getStocks } from "@/lib/data/stock-repository";

export default async function StocksPage() {
  const stocks = await getStocks(2500);

  return (
    <SiteShell>
      <PageTitle
        eyebrow="Equity research"
        title="Stocks"
        description="Explore Indian equities from the canonical GNSOne market database. Search by company name, NSE symbol or BSE code."
      />
      <Card>
        <StockSearch stocks={stocks} />
      </Card>
    </SiteShell>
  );
}
