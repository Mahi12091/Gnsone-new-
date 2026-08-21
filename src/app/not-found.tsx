import Link from "next/link";

export default function NotFound() {
  return <main className="min-h-screen bg-white px-6 py-20 text-center text-slate-950"><div className="mx-auto max-w-xl"><span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-emerald-500 font-black text-white">G</span><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Page not found</p><h1 className="mt-3 text-5xl font-semibold tracking-tight">This research page does not exist.</h1><p className="mt-4 text-sm leading-6 text-slate-600">The URL may be outdated or the instrument/page may no longer be available.</p><Link href="/" className="mt-7 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">Back to GNSOne</Link></div></main>;
}
