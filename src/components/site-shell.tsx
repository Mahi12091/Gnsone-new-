import Link from "next/link";

const links = [
  ["Markets", "/markets"], ["Stocks", "/stocks"], ["Screener", "/screener"], ["Compare", "/compare"], ["Research", "/research"],
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#06101d] text-slate-100">
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#06101d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-7 px-4 lg:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 font-black text-[#06101d]">G</span><span className="text-lg font-bold">GNSOne</span></Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-400 lg:flex">{links.map(([label,href]) => <Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/watchlist" className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white sm:block">Watchlist</Link>
          <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Sign in</Link>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 py-7 lg:px-7">{children}</div>
  </div>;
}

export function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-400">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>}</div>;
}

export function Card({ children, className = "", id, ariaLabel }: { children: React.ReactNode; className?: string; id?: string; ariaLabel?: string }) {
  return <section id={id} aria-label={ariaLabel} className={`rounded-xl border border-white/[.07] bg-[#0b1727] ${className}`}>{children}</section>;
}
