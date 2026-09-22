import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050508] px-6 text-center text-[#F5F7FB]">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">NEXI</p>
        <h1 className="mt-3 text-2xl font-semibold">That page is not available</h1>
        <p className="mt-2 text-sm text-[#C3BBD0]">The requested route does not exist or is no longer available.</p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#8B5CF6] px-4 text-sm font-semibold hover:bg-[#8B5CF6]/15"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
