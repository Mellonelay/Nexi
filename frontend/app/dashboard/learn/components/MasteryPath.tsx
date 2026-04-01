'use client';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

const tasks = [
    { id: 1, title: 'Verify Identity', status: 'completed' },
    { id: 2, title: 'Make First Deposit', status: 'completed' },
    { id: 3, title: 'Complete First Trade', status: 'current' },
    { id: 4, title: 'Refer a Friend', status: 'locked' },
];

export default function MasteryPath() {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const progress = (completed / tasks.length) * 100;

    return (
        <div className="bg-[#121836] rounded-2xl border border-gray-800/50 p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Mastery Path</h2>
                <span className="text-sm font-mono text-[#00C076]">{progress}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-800 rounded-full mb-6 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-[#00C076] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-4">
                {tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-4">
                        {/* Connector Line Logic would go here for vertical list, keeping it simple for now */}
                        <div className="shrink-0">
                            {task.status === 'completed' && <CheckCircle2 className="text-[#00C076]" size={24} />}
                            {task.status === 'current' && <Circle className="text-blue-500 animate-pulse" size={24} />}
                            {task.status === 'locked' && <Lock className="text-gray-600" size={24} />}
                        </div>
                        <div className={`${task.status === 'locked' ? 'opacity-50' : 'opacity-100'}`}>
                            <h4 className="font-bold text-white text-sm">{task.title}</h4>
                            <p className="text-xs text-gray-400">
                                {task.status === 'completed' ? 'Done' : task.status === 'current' ? 'In Progress' : 'Locked'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
