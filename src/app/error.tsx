"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-screen bg-white px-6 py-20 text-center text-slate-950"><div className="mx-auto max-w-xl"><span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-emerald-500 font-black text-white">G</span><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Something went wrong</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">We could not load this research view.</h1><p className="mt-4 text-sm leading-6 text-slate-600">Please try again. If the problem continues, return to the GNSOne home page.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => reset()} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Try again</button><Link href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</Link></div></div></main>;
}
