'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { ChevronLeft, History, ChevronRight, Camera, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoansPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const durationOptions = [7, 15, 30, 60];
  const handlingFeeRate = 0.001; // 0.1%

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      fetchMyLoans(u.id);
    }
  }, []);

  const fetchMyLoans = async (userId: string) => {
    try {
      const res = await api.get(`/loans/my/${userId}`);
      setMyLoans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async () => {
    if (!user || !amount || !duration) return alert('Please fill all fields');
    
    try {
      await api.post('/loans/apply', {
        userId: user.id,
        amount: Number.parseFloat(amount),
        duration,
        collateral: 'Image Upload', // Mock
        collateralImg: 'https://example.com/mock-id.jpg'
      });
      alert('Application Submitted');
      setAmount('');
      setDuration(null);
      fetchMyLoans(user.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-dexi-dark text-white p-4 pb-24 relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
            <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold">Loan</h1>
        <button className="p-2 hover:bg-white/10 rounded-full">
            <History />
        </button>
      </header>

      {/* Info Banner */}
      <div className="bg-[#1d2649] text-blue-300 p-4 rounded-lg text-sm mb-6 flex gap-2 items-start">
        <Info size={16} className="mt-1 flex-shrink-0" />
        <p>After platform review, you can apply for a loan from the platform</p>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-[#121836] rounded-xl border border-gray-800 p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <span className="text-gray-400 text-sm">Expected loan amount(USDT)</span>
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-right text-white outline-none w-32 font-mono"
                    placeholder="Enter"
                />
            </div>
            <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowDurationPicker(true)}
            >
                <span className="text-gray-400 text-sm">Repayment cycle</span>
                <div className="flex items-center gap-1 text-gray-300">
                    <span>{duration ? `${duration}day` : 'Please select'}</span>
                    <ChevronRight size={16} />
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="bg-[#121836] rounded-xl border border-gray-800 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-400">Daily interest rate</span>
                <span className="text-white">0%</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Repayment method</span>
                <span className="text-white">Repayment at maturity</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Interest</span>
                <span className="text-white">0 USDT</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Handling fee rate</span>
                <span className="text-white">0.1%</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Handling fee</span>
                <span className="text-white">{amount ? (Number.parseFloat(amount) * handlingFeeRate).toFixed(2) : '0'} USDT</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Lending institutions</span>
                <span className="text-white"></span>
            </div>
        </div>

        {/* Upload Section */}
        <div className="bg-[#121836] rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm text-gray-400 mb-4">Credit loan (image upload)</h3>
            <div className="flex gap-4">
                <div className="w-24 h-24 bg-[#0a0e27] rounded-lg flex items-center justify-center border border-gray-700 cursor-pointer hover:border-gray-500">
                    <Camera className="text-gray-500" />
                </div>
                <div className="w-24 h-24 bg-[#0a0e27] rounded-lg flex items-center justify-center border border-gray-700 cursor-pointer hover:border-gray-500">
                    <Camera className="text-gray-500" />
                </div>
            </div>
        </div>

        <button 
            onClick={handleApply}
            className="w-full py-4 bg-gradient-dexi text-white font-bold rounded-xl text-lg hover:shadow-neon-blue transition-all"
        >
            Apply Now
        </button>
      </div>

      {/* History Section */}
      {myLoans.length > 0 && (
          <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Loan History</h3>
              <div className="space-y-3">
                  {myLoans.map((loan) => (
                      <div key={loan.id} className="bg-[#121836] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                          <div>
                              <div className="font-bold">{loan.amount} USDT</div>
                              <div className="text-xs text-gray-400">{loan.durationDays} Days • {new Date(loan.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className={`px-3 py-1 rounded text-xs font-bold ${
                              loan.status === 'APPROVED' || loan.status === 'ACTIVE' ? 'bg-green-900 text-green-400' :
                              loan.status === 'REJECTED' ? 'bg-red-900 text-red-400' :
                              'bg-yellow-900 text-yellow-400'
                          }`}>
                              {loan.status}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Duration Picker Modal */}
      {showDurationPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white text-black w-full rounded-t-2xl overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <button onClick={() => setShowDurationPicker(false)} className="text-gray-500">Cancel</button>
                    <button onClick={() => setShowDurationPicker(false)} className="text-blue-500 font-bold">Done</button>
                </div>
                <div className="p-4 space-y-2">
                    {durationOptions.map(d => (
                        <div 
                            key={d}
                            onClick={() => { setDuration(d); setShowDurationPicker(false); }}
                            className={`p-4 text-center text-lg cursor-pointer hover:bg-gray-100 rounded-lg ${duration === d ? 'font-bold text-blue-600' : 'text-gray-600'}`}
                        >
                            {d}day
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}
