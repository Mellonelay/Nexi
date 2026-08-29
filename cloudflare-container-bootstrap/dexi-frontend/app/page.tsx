'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Globe2, ShieldCheck, Wallet } from 'lucide-react';

const surfaces = [
  { title: 'Crypto', detail: 'Explore approved digital assets and project context.', icon: BarChart3 },
  { title: 'Metal', detail: 'Discover configured precious-metal instruments.', icon: ShieldCheck },
  { title: 'Forex', detail: 'Review approved currency-pair availability.', icon: Globe2 },
  { title: 'Shares', detail: 'Follow configured equity instruments.', icon: Wallet },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050508] text-[#F8F6FF]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/25 bg-[#21152F] font-semibold">N</div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em]">NEXI</p>
              <p className="text-xs text-[#8C8299]">Market workspace</p>
            </div>
          </div>
          <Link href="/login" className="min-h-11 rounded-lg border border-violet-300/20 px-4 py-2 text-sm font-semibold text-[#C3BBD0] transition hover:border-violet-300/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Sign in</Link>
        </header>

        <section className="relative flex flex-1 flex-col justify-center py-20">
          <div className="pointer-events-none absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-violet-500/15 blur-[110px]" />
          <div className="relative max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#A995FF]">Precision for moving markets</p>
            <h1 className="max-w-3xl text-[clamp(2.5rem,13vw,6rem)] font-semibold tracking-[-0.055em] lg:text-8xl">Discover the market with clarity.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#C3BBD0] sm:text-lg">NEXI brings approved instruments, market context, and focused decision surfaces into one Deep Liquid Violet workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#8B5CF6] px-5 text-sm font-semibold text-white transition hover:bg-[#A375FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Open Quotes Hub <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/signup" className="inline-flex min-h-12 items-center rounded-lg border border-violet-300/20 px-5 text-sm font-semibold text-[#C3BBD0] transition hover:border-violet-300/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Create account</Link>
            </div>
          </div>
        </section>

        <section aria-label="Market categories" className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 lg:grid-cols-4">
          {surfaces.map(({ title, detail, icon: Icon }) => (
            <Link key={title} href="/dashboard" className="group rounded-xl border border-violet-300/15 bg-[#100A18] p-5 transition hover:border-violet-300/35 hover:bg-[#171022] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">
              <Icon className="h-5 w-5 text-[#A995FF]" aria-hidden="true" />
              <h2 className="mt-6 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#8C8299]">{detail}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
