'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-dexi-dark overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-dexi-blue/10 via-dexi-purple/10 to-dexi-pink/10"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-7xl font-bold mb-6 gradient-text uppercase tracking-wider">
              WELCOME TO THE
              <br />
              DEXI EXCHANGE
            </h1>
            <p className="text-2xl text-gray-300 mb-4">
              Futures-Forex-Cryptocurrency
            </p>
            <p className="text-xl text-dexi-cyan">
              Start your trading today
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-4xl mx-auto mb-16"
          >
            <div className="relative h-96 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-dexi opacity-20 blur-3xl rounded-full"></div>
              <div className="relative text-center">
                <div className="text-9xl mb-4">🚀</div>
                <p className="text-2xl text-dexi-cyan font-semibold">
                  Advanced Trading Platform
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            <Link
              href="/dashboard"
              className="card-dark p-8 text-center hover:shadow-neon-blue transition-all duration-300 group"
            >
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-dexi-cyan group-hover:text-dexi-blue transition-colors">
                Crypto
              </h3>
              <p className="text-gray-400 text-sm">
                Trade Bitcoin, Ethereum, and more
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="card-dark p-8 text-center hover:shadow-neon-purple transition-all duration-300 group"
            >
              <div className="text-5xl mb-4">🥇</div>
              <h3 className="text-xl font-bold mb-2 text-dexi-purple group-hover:text-dexi-pink transition-colors">
                Metal
              </h3>
              <p className="text-gray-400 text-sm">
                Gold, Silver, Platinum trading
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="card-dark p-8 text-center hover:shadow-neon-cyan transition-all duration-300 group"
            >
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-2 text-dexi-cyan group-hover:text-dexi-blue transition-colors">
                Stones
              </h3>
              <p className="text-gray-400 text-sm">
                Diamond and precious stones
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="card-dark p-8 text-center hover:shadow-neon-blue transition-all duration-300 group"
            >
              <div className="text-5xl mb-4">💱</div>
              <h3 className="text-xl font-bold mb-2 text-dexi-blue group-hover:text-dexi-cyan transition-colors">
                Forex
              </h3>
              <p className="text-gray-400 text-sm">
                Currency pairs trading
              </p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <Link
              href="/dashboard"
              className="inline-block px-12 py-4 bg-gradient-dexi text-white font-bold text-lg rounded-lg hover:shadow-neon-blue transition-all duration-300 transform hover:scale-105"
            >
              Start Trading Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
