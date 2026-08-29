'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      router.replace('/dashboard/admin');
    } catch (cause: any) {
      setError(cause?.response?.data?.message || 'Admin authentication failed');
    }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#0a0e27] px-4 text-white"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#121836] p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7DF9FF]">Separate control plane</p><h1 className="mt-2 text-2xl font-bold">Admin sign in</h1><p className="mt-2 text-sm text-gray-400">Admin credentials and sessions are isolated from public user authentication.</p></div>{error && <p className="text-sm text-red-300" role="alert">{error}</p>}<label className="block text-sm">Email<input className="mt-2 w-full rounded border border-white/10 bg-[#0a0e27] p-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="block text-sm">Password<input className="mt-2 w-full rounded border border-white/10 bg-[#0a0e27] p-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="w-full rounded bg-[#00C076] px-4 py-3 font-bold text-black" type="submit">Sign in to Admin</button></form></main>;
}
