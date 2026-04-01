'use client';

import React, { useState } from 'react';
import { MessageCircle, Send, Headphones, HelpCircle, ShieldCheck } from 'lucide-react';

export default function SupportPage() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'bot', text: 'Hello! Welcome to Dexi VIP Support. How can we help you today?' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setChat([...chat, { role: 'user', text: message }]);
    setMessage('');
    // Simulate bot response
    setTimeout(() => {
      setChat(prev => [...prev, { role: 'bot', text: 'Thank you for your message. An agent will be with you shortly.' }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-[#121836]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Headphones size={24} />
          </div>
          <div>
            <h1 className="font-bold">24/7 VIP Support</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-green-500 uppercase font-black">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Agents Online
            </div>
          </div>
        </div>
      </div>

      {/* Quick FAQ */}
      <div className="p-4 flex gap-3 overflow-x-auto whitespace-nowrap bg-black/20">
        {['Deposit Help', 'KYC Status', 'Trade Issue', 'Withdrawal'].map((q) => (
          <button key={q} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-gray-400">
            {q}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
              msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-[#121836] text-gray-300 rounded-bl-none border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-28 bg-[#121836]/80 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center gap-2 bg-[#0a0e27] rounded-2xl p-2 border border-white/10">
          <input 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Type your message..." 
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm" 
          /> 
          <button 
            onClick={handleSend} 
            className="p-3 bg-purple-600 rounded-xl hover:bg-purple-500 active:scale-95 transition-all" 
          > 
            <Send size={18} /> 
          </button> 
        </div>
      </div>
    </div>
  );
}
