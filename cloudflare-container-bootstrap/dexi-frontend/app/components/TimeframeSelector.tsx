'use client';

interface TimeframeSelectorProps {
  interval: string;
  onChange: (interval: string) => void;
}

const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export default function TimeframeSelector({ interval, onChange }: TimeframeSelectorProps) {
  return (
    <div role="group" aria-label="Chart timeframe" className="nexi-scroll-rail flex min-w-0 items-center gap-1 overflow-x-auto text-xs font-semibold">
      {timeframes.map((tf) => (
        <button key={tf} type="button" aria-pressed={interval === tf} onClick={() => onChange(tf)}
          className={`nexi-interactive min-h-11 min-w-11 shrink-0 rounded-lg px-2 transition-colors ${interval === tf ? 'bg-[#2A1742] text-[#F8F6FF]' : 'text-[#8C8299] hover:bg-white/5 hover:text-white'}`}>
          {tf}
        </button>
      ))}
    </div>
  );
}
