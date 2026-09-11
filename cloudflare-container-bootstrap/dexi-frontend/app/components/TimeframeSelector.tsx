'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimeframeSelectorProps {
  interval: string;
  onChange: (interval: string) => void;
}

const favorites = ['1m', '5m', '15m', '1h', '4h'];
const categories = [
  { name: 'MINUTES', items: ['1m', '3m', '5m', '15m', '30m'] },
  { name: 'HOURS', items: ['1h', '2h', '4h', '6h', '8h', '12h'] },
  { name: 'DAYS', items: ['1d', '3d', '1w', '1M'] },
];

export default function TimeframeSelector({ interval, onChange }: TimeframeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1 text-xs font-bold" ref={dropdownRef}>
      <span className="text-gray-500 mr-2">Time</span>
      
      {/* Favorites */}
      {favorites.map((tf) => (
        <button
          key={tf}
          type="button"
          onClick={() => onChange(tf)}
          className={`px-2 py-1 rounded transition-colors ${
            interval === tf 
              ? 'text-[#00C076] bg-[#00C076]/10' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {tf}
        </button>
      ))}

      {/* Dropdown Trigger */}
      <div className="relative ml-1">
        <button
          type="button"
          aria-label="Open timeframe menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 rounded transition-colors ${
            isOpen ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ChevronDown size={14} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e222d] border border-gray-700 rounded shadow-xl z-[100] max-h-[400px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.name} className="py-1 border-b border-gray-700 last:border-0">
                <div className="px-3 py-1 text-[10px] text-gray-500 font-semibold">
                  {cat.name}
                </div>
                {cat.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#2a2e39] transition-colors ${
                      interval === item ? 'text-[#00C076]' : 'text-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
