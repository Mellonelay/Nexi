'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { Hammer, Timer, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function MiningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchPlans();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      fetchMySubs(u.id);
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/mining/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMySubs = async (userId: string) => {
    try {
      const res = await api.get(`/mining/my/${userId}`);
      setMySubs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;

    try {
      await api.post('/mining/subscribe', {
        userId: user.id,
        planId: selectedPlan.id,
        amount: Number.parseFloat(amount),
      });
      alert('Subscribed Successfully!');
      setSelectedPlan(null);
      setAmount('');
      fetchMySubs(user.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Subscription Failed');
    }
  };

  return (
    <div className="min-h-screen bg-dexi-dark text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-dexi-gold/10 rounded-xl">
            <Hammer className="text-dexi-gold w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text-gold">Liquidity Mining</h1>
            <p className="text-gray-400">Stake USDT to earn daily rewards</p>
          </div>
        </header>

        {/* Mining Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              className="card-dark p-6 border border-dexi-gold/20 hover:border-dexi-gold/50 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 bg-dexi-gold/10 rounded-bl-xl">
                <span className="text-xs font-bold text-dexi-gold">{plan.lockupPeriod} Days Lock</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-dexi-gold">{plan.dailyYield}%</span>
                <span className="text-sm text-gray-400 mb-1">daily</span>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Min Deposit</span>
                  <span className="font-mono text-white">{plan.minDeposit} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Deposit</span>
                  <span className="font-mono text-white">{plan.maxDeposit} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Total ROI</span>
                  <span className="font-mono text-dexi-green">{(plan.dailyYield * plan.lockupPeriod).toFixed(1)}%</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan(plan)}
                className="w-full py-3 bg-gradient-gold text-dexi-dark font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Start Mining
              </button>
            </motion.div>
          ))}
        </div>

        {/* Active Subscriptions */}
        {mySubs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-dexi-green" /> My Active Miners
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {mySubs.map((sub) => (
                <div key={sub.id} className="bg-dexi-darker p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${sub.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
                      {sub.status === 'ACTIVE' ? <Timer size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{sub.plan.name}</h4>
                      <div className="text-xs text-gray-400 flex gap-2">
                        <span>Started: {new Date(sub.startDate).toLocaleDateString()}</span>
                        <span>Ends: {new Date(sub.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 text-right">
                    <div>
                      <div className="text-xs text-gray-400">Staked Amount</div>
                      <div className="font-mono font-bold">{sub.amount} USDT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Earned</div>
                      <div className="font-mono font-bold text-dexi-gold">+{sub.totalRewards.toFixed(4)} USDT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Status</div>
                      <div className={`font-bold text-xs px-2 py-1 rounded ${sub.status === 'ACTIVE' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                        {sub.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscribe Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-dexi-dark border border-gray-700 w-full max-w-md rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold mb-2">Stake {selectedPlan.name}</h2>
              <p className="text-gray-400 text-sm mb-6">
                Lock your USDT for {selectedPlan.lockupPeriod} days to earn {selectedPlan.dailyYield}% daily.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 ml-1">Investment Amount (USDT)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-dexi-darker border border-gray-700 rounded-lg p-3 outline-none focus:border-dexi-gold font-mono"
                      placeholder={`${selectedPlan.minDeposit} - ${selectedPlan.maxDeposit}`}
                      required
                      min={selectedPlan.minDeposit}
                      max={selectedPlan.maxDeposit}
                    />
                    <span className="absolute right-3 top-3 text-gray-500 text-sm">USDT</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Est. Daily Return: <span className="text-dexi-gold">{amount ? (Number.parseFloat(amount) * selectedPlan.dailyYield / 100).toFixed(2) : '0.00'} USDT</span>
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setSelectedPlan(null); setAmount(''); }}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-dexi-gold text-dexi-dark hover:bg-yellow-500 rounded-xl font-bold transition-colors"
                  >
                    Confirm Stake
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
