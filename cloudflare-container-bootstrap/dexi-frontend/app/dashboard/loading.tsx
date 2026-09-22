export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center bg-[#050508] px-6 text-sm text-[#8C8299]"
      role="status"
      aria-live="polite"
    >
      Loading workspace…
    </div>
  );
}
