import Link from "next/link";
import { Card, PageTitle, SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "IPO Research — Upcoming, Open & Listed IPOs | GNSOne",
  description: "Research upcoming, open and recently listed IPOs with issue details, timelines, valuation context and structured research tools on GNSOne.",
  alternates: { canonical: "/ipo" },
};

const stages = [
  ["Upcoming IPOs", "Track issues before they open and prepare your research."],
  ["Open IPOs", "Review live issue dates, price bands and key offer details."],
  ["Recently Listed", "Follow newly listed companies and post-listing performance."],
];
const checklist = ["Issue size and fresh issue", "Price band and lot size", "Subscription and listing timeline", "Financial performance", "Valuation and peer context", "Risk factors and offer details"];

export default function IPOPage() {
  return <SiteShell>
    <PageTitle eyebrow="Primary market research" title="Research IPOs with more context before you decide." description="Discover upcoming, open and recently listed IPOs with a structured view of offer details, financials, valuation, timelines and key research factors." />
    <section className="mb-8 grid gap-5 md:grid-cols-3">
      {stages.map(([title, text], index) => <Card key={title} className="p-6"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">0{index + 1}</span><span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">IPO</span></div><h2 className="mt-6 text-xl font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><Link href="/stocks" className="mt-5 inline-block text-sm font-semibold text-emerald-700">Explore research →</Link></Card>)}
    </section>
    <Card className="overflow-hidden bg-slate-50! border-slate-200! p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-600">IPO research checklist</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Know what to review before applying.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">GNSOne is designed to organize the information investors commonly need when researching a public issue.</p></div><ul className="grid gap-3 sm:grid-cols-2">{checklist.map((item) => <li key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">✓ {item}</li>)}</ul></div>
    </Card>
  </SiteShell>;
}
