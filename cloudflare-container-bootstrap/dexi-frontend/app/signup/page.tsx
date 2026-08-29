'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#050508] px-4 py-8 text-[#F8F6FF]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(109,65,255,.22),transparent_42%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-violet-300/15 bg-[#171022] p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-8">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A995FF]">NEXI</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-[#8C8299]">Start with your NEXI market workspace.</p>
        </div>
        {error && <p className="mb-4 rounded-xl border border-rose-300/20 bg-rose-950/30 p-3 text-center text-sm text-rose-200" role="alert">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-[#C3BBD0]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-white outline-none transition focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#C3BBD0]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-white outline-none transition focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
              required
            />
          </div>
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#8C8299]">
          Already have an account? <Link href="/login" className="text-[#A995FF] hover:text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
