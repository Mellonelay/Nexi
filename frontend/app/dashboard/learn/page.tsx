'use client';

import MarketPulse from './components/MarketPulse';
import MasteryPath from './components/MasteryPath';
import VideoShorts from './components/VideoShorts';
import { GraduationCap, Award, BookOpen } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="p-4 md:p-6 bg-[#0a0e27] min-h-screen text-white pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <GraduationCap className="text-dexi-cyan" size={32} />
                Dexi Academy
            </h1>
            <p className="text-gray-400 mt-2">Master the markets with our curated learning path.</p>
        </div>
        <div className="hidden md:flex gap-4">
            <div className="bg-[#121836] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <Award className="text-yellow-500" size={20} />
                <span className="font-bold">Level 3 Trader</span>
            </div>
            <div className="bg-[#121836] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
                <BookOpen className="text-blue-500" size={20} />
                <span className="font-bold">12 Lessons Completed</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-6">
            {/* Featured Hero (Could be added later) */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MasteryPath />
                <VideoShorts />
            </div>

            {/* Course Grid (Reusing simplified version of previous list) */}
            <div className="bg-[#121836] rounded-2xl border border-gray-800/50 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Popular Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Crypto Basics', 'Advanced Trading', 'DeFi Masterclass'].map((title, i) => (
                        <div key={i} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 hover:border-blue-500/50 cursor-pointer transition-colors group">
                            <div className="h-24 bg-gradient-to-br from-gray-800 to-black rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-4xl group-hover:scale-110 transition-transform">🎓</span>
                            </div>
                            <h3 className="font-bold text-white">{title}</h3>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-blue-500 h-full w-1/3"></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">33% Completed</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="lg:col-span-4 space-y-6">
            <MarketPulse />
            
            {/* Quick Tip Widget */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2">💡 Pro Tip</h3>
                <p className="text-sm opacity-90 mb-4">
                    Always use stop-loss orders to manage your risk. Never invest more than you can afford to lose.
                </p>
                <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                    Read Guide
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
