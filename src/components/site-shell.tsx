import Link from "next/link";

const links = [
  ["Markets", "/markets"], ["Stocks", "/stocks"], ["Screener", "/screener"], ["Compare", "/compare"], ["Research", "/research"],
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="gns-light-page min-h-screen bg-white text-slate-950">
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-7 px-4 lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 font-black text-white shadow-sm shadow-emerald-100">G</span><span className="text-lg font-bold tracking-[-.02em]">GNSOne</span></Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 lg:flex">{links.map(([label,href]) => <Link key={href} href={href} className="transition hover:text-slate-950">{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/watchlist" className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950 sm:block">Watchlist</Link>
          <Link href="/login" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</Link>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 py-7 lg:px-7">{children}</div>
  </div>;
}

export function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}</div>;
}

export function Card({ children, className = "", id, ariaLabel }: { children: React.ReactNode; className?: string; id?: string; ariaLabel?: string }) {
  return <section id={id} aria-label={ariaLabel} className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}
