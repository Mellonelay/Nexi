'use client';
import { PlayCircle } from 'lucide-react';

const videos = [
    { id: 1, title: 'How to Deposit Crypto', duration: '2:15', thumbnail: 'bg-gradient-to-br from-purple-900 to-blue-900' },
    { id: 2, title: 'Spot Trading 101', duration: '5:30', thumbnail: 'bg-gradient-to-br from-green-900 to-teal-900' },
    { id: 3, title: 'Understanding Options', duration: '8:45', thumbnail: 'bg-gradient-to-br from-orange-900 to-red-900' },
    { id: 4, title: 'Security Best Practices', duration: '3:20', thumbnail: 'bg-gradient-to-br from-gray-800 to-black' },
];

export default function VideoShorts() {
    return (
        <div className="bg-[#121836] rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Video Shorts</h2>
            
            <div className="grid grid-cols-2 gap-4">
                {videos.map(video => (
                    <div key={video.id} className="group cursor-pointer">
                        <div className={`aspect-video rounded-xl ${video.thumbnail} relative overflow-hidden mb-2 border border-gray-700 group-hover:border-white/50 transition-colors`}>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                                <PlayCircle size={32} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                {video.duration}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                            {video.title}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
