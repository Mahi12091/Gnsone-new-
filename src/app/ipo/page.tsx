import Link from "next/link";

export const metadata = {
  title: "IPO Research — Upcoming, Open & Listed IPOs | GNSOne",
  description: "Research upcoming, open and recently listed IPOs with issue details, timelines, valuation context and structured research tools on GNSOne.",
};

const stages = [
  ["Upcoming IPOs", "Track issues before they open and prepare your research."],
  ["Open IPOs", "Review live issue dates, price bands and key offer details."],
  ["Recently Listed", "Follow newly listed companies and post-listing performance."],
];

const checklist = ["Issue size and fresh issue", "Price band and lot size", "Subscription and listing timeline", "Financial performance", "Valuation and peer context", "Risk factors and offer details"];

export default function IPOPage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl"><div className="mx-auto flex h-[68px] max-w-[1440px] items-center px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 font-black text-white">G</span><span className="text-lg font-bold">GNSOne</span></Link><nav className="ml-8 hidden gap-5 xl:flex">{[["Markets","/markets"],["Stocks","/stocks"],["IPO","/ipo"],["Mutual Funds","/mutual-funds"],["ETFs","/etfs"],["Bonds","/bonds"],["Screener","/screener"],["Compare","/compare"]].map(([x,h])=><Link key={x} href={h} className="text-[13px] font-medium text-slate-600 hover:text-slate-950">{x}</Link>)}</nav><Link href="/signin" className="ml-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Sign in</Link></div></header>
    <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 to-white"><div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:py-20"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-emerald-600">Primary market research</p><h1 className="max-w-3xl text-4xl font-bold tracking-[-.04em] sm:text-5xl">Research IPOs with more context before you decide.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">Discover upcoming, open and recently listed IPOs with a structured view of offer details, financials, valuation, timelines and key research factors.</p></div></section>
    <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16"><div className="grid gap-5 md:grid-cols-3">{stages.map(([title,text])=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 h-2 w-12 rounded-full bg-emerald-500"/><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><Link href="/stocks" className="mt-5 inline-block text-sm font-semibold text-emerald-700">Explore research →</Link></article>)}</div><div className="mt-12 grid gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">IPO research checklist</p><h2 className="mt-2 text-2xl font-bold">Know what to review before applying.</h2><p className="mt-3 text-sm leading-6 text-slate-600">GNSOne is designed to organize the information investors commonly need when researching a public issue.</p></div><ul className="grid gap-3 sm:grid-cols-2">{checklist.map(item=><li key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">✓ {item}</li>)}</ul></div></section>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} GNSOne. Research platform, not personalized investment advice.</footer>
  </main>;
}
