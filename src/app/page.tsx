const modules = [
  "Stocks",
  "Fundamentals",
  "Valuation",
  "GNS Score",
  "Screener",
  "Market Intelligence",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="text-xl font-bold tracking-tight">GNSOne</div>
          <div className="text-sm text-slate-400">Investor Research Platform</div>
        </header>

        <section className="py-24 md:py-32">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-green-400">
            Research smarter
          </p>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            Understand the market before you make a decision.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            GNSOne is being built as a structured research and market intelligence
            platform for Indian investors.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
            >
              <h2 className="font-semibold">{module}</h2>
              <p className="mt-2 text-sm text-slate-500">Coming in the build roadmap.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
