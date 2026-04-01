'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { ArrowDownUp } from 'lucide-react';

export default function ConversionPage() {
  const [fromCoin, setFromCoin] = useState('USDT');
  const [toCoin, setToCoin] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
    fetchRate();
  }, [fromCoin, toCoin]);

  const fetchRate = async () => {
    try {
      const res = await api.get(`/conversion/rate?from=${fromCoin}&to=${toCoin}`);
      setRate(res.data.rate);
    } catch (err) {
      console.error(err);
      setRate(0);
    }
  };

  const handleSwap = () => {
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
  };

  const convert = async () => {
    try {
      await api.post('/conversion/convert', {
        userId: user.id,
        from: fromCoin,
        to: toCoin,
        amount: parseFloat(amount),
      });
      alert('Conversion Successful');
      setAmount('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Conversion Failed');
    }
  };

  const estimatedReceive = amount && rate ? (Number.parseFloat(amount) * rate).toFixed(6) : '0.00';

  return (
    <div className="flex justify-center items-center h-[calc(100vh-100px)]">
      <div className="w-full max-w-md bg-gray-900 rounded-lg border border-gray-800 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Convert</h1>

        {/* From */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="text-xs text-gray-400 mb-1 block">From</label>
          <div className="flex gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-2xl font-bold focus:outline-none w-full"
              placeholder="0.00"
            />
            <select
              value={fromCoin}
              onChange={(e) => setFromCoin(e.target.value)}
              className="bg-gray-700 rounded px-2 font-bold"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center -my-3 relative z-10">
          <button onClick={handleSwap} className="bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition">
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* To */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="text-xs text-gray-400 mb-1 block">To</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={estimatedReceive}
              readOnly
              className="bg-transparent text-2xl font-bold focus:outline-none w-full text-gray-400"
            />
            <select
              value={toCoin}
              onChange={(e) => setToCoin(e.target.value)}
              className="bg-gray-700 rounded px-2 font-bold"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 flex justify-between px-2">
          <span>Rate</span>
          <span>1 {fromCoin} ≈ {rate} {toCoin}</span>
        </div>

        <button
          onClick={convert}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition"
        >
          Convert Now
        </button>
      </div>
    </div>
  );
}
