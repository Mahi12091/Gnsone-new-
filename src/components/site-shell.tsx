import Link from "next/link";

const links = [
  ["Markets", "/markets"], ["Stocks", "/stocks"], ["IPO", "/ipo"], ["Mutual Funds", "/mutual-funds"], ["ETFs", "/etfs"], ["Bonds", "/bonds"], ["Screener", "/screener"], ["Compare", "/compare"], ["GNS Score", "/gns-score"],
];
const footerExplore = [["Stocks", "/stocks"], ["IPOs", "/ipo"], ["Mutual Funds", "/mutual-funds"], ["ETFs", "/etfs"], ["Bonds", "/bonds"], ["Markets", "/markets"]];
const footerTools = [["Screener", "/screener"], ["Compare", "/compare"], ["GNS Score", "/gns-score"]];
const footerCompany = [["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Disclaimer", "/disclaimer"]];

function FooterLinks({ items }: { items: string[][] }) {
  return <div className="mt-4 space-y-3 text-xs text-slate-500">{items.map(([label, href]) => <Link key={href} className="block transition hover:text-slate-950" href={href}>{label}</Link>)}</div>;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="gns-light-page min-h-screen bg-white text-slate-950">
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-7 px-4 sm:px-6 lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GNSOne home"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 font-black text-white shadow-sm shadow-emerald-100">G</span><span className="text-lg font-bold tracking-[-.02em]">GNSOne</span></Link>
        <nav className="hidden items-center gap-5 text-[13px] text-slate-600 xl:flex" aria-label="Primary navigation">{links.map(([label, href]) => <Link key={href} href={href} className="font-medium transition hover:text-slate-950">{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/stocks" className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950 xl:block">Search</Link>
          <Link href="/login" className="hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 xl:block">Sign in</Link>
          <details className="relative xl:hidden">
            <summary className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Open navigation menu"><span className="flex flex-col gap-1.5"><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /></span></summary>
            <div className="gns-mobile-menu absolute right-0 top-12 z-[60] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
              <nav aria-label="Mobile navigation" className="space-y-1">
                {links.map(([label, href]) => <Link key={href} href={href} className="block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950">{label}</Link>)}
                <div className="my-2 border-t border-slate-100" />
                <Link href="/stocks" className="block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950">Search</Link>
                <Link href="/login" className="block whitespace-nowrap rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">Sign in</Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-7">{children}</main>
    <footer className="mt-8 border-t border-slate-200 bg-white"><div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-7"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><Link href="/" className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-sm font-black text-white">G</span><span className="font-bold text-slate-900">GNSOne</span></Link><p className="mt-4 max-w-xs text-xs leading-5 text-slate-500">Research smarter. Invest with clarity.</p><p className="mt-5 max-w-sm text-[10px] leading-5 text-slate-400">Market data and research are provided for informational purposes and may be delayed. GNSOne does not provide personalized investment advice.</p></div><div><p className="text-xs font-bold text-slate-900">Explore</p><FooterLinks items={footerExplore} /></div><div><p className="text-xs font-bold text-slate-900">Tools</p><FooterLinks items={footerTools} /></div><div><p className="text-xs font-bold text-slate-900">Company</p><FooterLinks items={footerCompany} /></div></div><div className="mt-10 border-t border-slate-100 pt-5 text-center text-[10px] leading-5 text-slate-400"><p>© 2026 GNSOne. All rights reserved.</p><p>Investment research · Market intelligence</p></div></div></footer>
  </div>;
}

export function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) { return <div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}</div>; }
export function Card({ children, className = "", id, ariaLabel }: { children: React.ReactNode; className?: string; id?: string; ariaLabel?: string }) { return <section id={id} aria-label={ariaLabel} className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>; }
