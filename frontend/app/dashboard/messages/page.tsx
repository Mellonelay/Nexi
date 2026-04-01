'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

export default function MessagesPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Support', text: 'Welcome to Nexi! How can we help you today?', time: '10:00 AM', isUser: false }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'You',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    }]);
    setInput('');
    
    // Simulate auto-reply
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'Support',
            text: 'Thank you for your message. An agent will be with you shortly.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: false
        }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold gradient-text">Messages</h1>
        <span className="bg-dexi-green/20 text-dexi-green text-xs px-2 py-1 rounded-full">Support Online</span>
      </div>

      <div className="flex-1 bg-dexi-darker border border-dexi-purple/20 rounded-xl flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.isUser 
                  ? 'bg-dexi-cyan/20 text-white border border-dexi-cyan/30 rounded-tr-none' 
                  : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-[10px] opacity-50 block text-right mt-1">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 border-t border-dexi-purple/20 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-dexi-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-dexi-cyan outline-none transition-colors"
          />
          <button 
            onClick={handleSend}
            className="bg-dexi-cyan hover:bg-dexi-blue text-black font-bold p-2 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
