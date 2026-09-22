'use client';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-[#050508] px-6 text-center text-[#F5F7FB]">
      <div role="alert" className="max-w-md rounded-xl border border-[#FF5C7C]/30 bg-[#171022] p-6">
        <h2 className="text-base font-semibold">Workspace temporarily unavailable</h2>
        <p className="mt-2 text-sm text-[#C3BBD0]">Your account and market data were not changed. Try this section again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#8B5CF6] px-4 text-sm font-semibold text-[#F5F7FB] hover:bg-[#8B5CF6]/15"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
