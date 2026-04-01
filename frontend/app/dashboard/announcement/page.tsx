'use client';

import React from 'react';
import { Megaphone, ChevronRight, Calendar, Bookmark } from 'lucide-react';

export default function AnnouncementPage() {
  const news = [
    {
      id: 1,
      title: "Dexi Listing: New High-Yield Binary Options Pairs",
      date: "2024-05-20",
      category: "LISTING",
      excerpt: "We are excited to announce the addition of 12 new currency pairs to our micro-trading engine..."
    },
    {
      id: 2,
      title: "System Maintenance: Wallet Upgrade",
      date: "2024-05-18",
      category: "SYSTEM",
      excerpt: "Scheduled maintenance for the wallet service to enhance transaction speed and security."
    },
    {
      id: 3,
      title: "Global Trading Competition: $50,000 Prize Pool",
      date: "2024-05-15",
      category: "PROMO",
      excerpt: "Join the elite traders this month and compete for the top spot in our monthly leaderboard."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white p-4 pb-24">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Megaphone size={20} className="text-blue-400" />
        </div>
        <h1 className="text-xl font-bold italic tracking-tighter">NEWS <span className="text-blue-500">CENTER</span></h1>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="bg-[#121836] p-5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-500 text-black uppercase">
                {item.category}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Calendar size={10} />
                {item.date}
              </div>
            </div>
            <h2 className="font-bold text-sm leading-tight mb-2 group-hover:text-blue-400 transition-colors">
              {item.title}
            </h2>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {item.excerpt}
            </p>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-[10px] text-gray-600 italic">Read full article</span>
              <ChevronRight size={14} className="text-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
