'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save, DollarSign, Wallet, Hammer, CreditCard, Settings, Users, Activity, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';
import { io } from 'socket.io-client';

// --- Sub-Components for Tabs ---

function UserManagement({ users }: { users: any[] }) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="bg-[#121836] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-white">{user.email}</div>
              <div className="text-xs text-gray-500 font-mono">{user.id}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Balance</div>
              <div className="font-bold text-[#00C076]">${user.wallet?.balance?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#0a0e27] p-2 rounded-lg">
            <ShieldAlert size={14} className="text-yellow-300" />
            <span className="text-xs text-yellow-200">Sandbox outcome controls are disabled in this Admin surface.</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CryptoManagement() {
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/currencies').then(res => setCurrencies(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-400">Supported Currencies</h3>
        <button className="bg-[#00C076] text-black px-3 py-1 rounded text-xs font-bold">+ Add Coin</button>
      </div>
      {currencies.map(c => (
        <div key={c.id} className="bg-[#121836] p-4 rounded-xl border border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {c.logo && <img src={c.logo} alt={c.symbol} className="w-8 h-8 rounded-full" />}
            <div>
              <div className="font-bold">{c.symbol}</div>
              <div className="text-xs text-gray-500">{c.name}</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-gray-400">Rate: <span className="text-white">{c.rate}</span></div>
            <div className={`font-bold ${c.isActive ? 'text-green-500' : 'text-red-500'}`}>{c.isActive ? 'Active' : 'Disabled'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiningManagement() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/mining-plans').then(res => setPlans(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-400">Mining Plans</h3>
        <button className="bg-[#00C076] text-black px-3 py-1 rounded text-xs font-bold">+ Add Plan</button>
      </div>
      {plans.map(p => (
        <div key={p.id} className="bg-[#121836] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between mb-2">
            <span className="font-bold">{p.name}</span>
            <span className="text-[#00C076] font-bold">{p.dailyYield}% Daily</span>
          </div>
          <div className="text-xs text-gray-400 flex gap-4">
            <span>Lock: {p.lockupPeriod} Days</span>
            <span>Min: {p.minDeposit} USDT</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoanManagement() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/loan-plans').then(res => setPlans(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-400">Loan Config</h3>
        <button className="bg-[#00C076] text-black px-3 py-1 rounded text-xs font-bold">+ Add Tier</button>
      </div>
      {plans.map(p => (
        <div key={p.id} className="bg-[#121836] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between mb-2">
            <span className="font-bold">{p.name}</span>
            <span className="text-blue-400 font-bold">{(p.interestRate * 100).toFixed(1)}% Fee</span>
          </div>
          <div className="text-xs text-gray-400">
            Duration: {p.durationDays} Days
          </div>
        </div>
      ))}
    </div>
  );
}

function GovernanceManagement() {
  const [commands, setCommands] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = async () => {
    try {
      const [commandsResponse, flagsResponse] = await Promise.all([api.get('/admin/governance/commands'), api.get('/admin/feature-flags')]);
      setCommands(Array.isArray(commandsResponse.data) ? commandsResponse.data : []);
      setFlags(Array.isArray(flagsResponse.data) ? flagsResponse.data : []);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Governance data unavailable'); }
  };
  useEffect(() => { void load(); }, []);
  const createCommand = async () => {
    const reason = window.prompt('Reason for governed command:');
    if (!reason?.trim()) return;
    try {
      await api.post('/admin/governance/commands', { commandType: 'MAINTENANCE_MODE', target: 'public-api', reason, idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `admin-${Date.now()}`, payload: { requestedFrom: 'admin-ui' } });
      setFeedback('Governance command created and awaiting independent approval.');
      await load();
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Command rejected'); }
  };
  return <div className="space-y-5"><div className="flex items-center justify-between"><h3 className="font-bold text-gray-400">Governed commands</h3><button onClick={() => void createCommand()} className="bg-[#00C076] text-black px-3 py-2 rounded text-xs font-bold">Request command</button></div>{feedback && <p className="text-sm text-yellow-200" role="status">{feedback}</p>}<div className="space-y-3">{commands.map((command) => <article key={command.id} className="bg-[#121836] p-4 rounded-xl border border-white/5"><div className="flex justify-between gap-3"><span className="font-bold">{command.commandType}</span><span className="font-mono text-xs text-[#7DF9FF]">{command.status}</span></div><p className="mt-2 text-xs text-gray-400">{command.reason}</p><p className="mt-2 text-[10px] text-gray-500">Independent approval is required; Admin UI never mutates financial truth directly.</p></article>)}</div><div><h3 className="font-bold text-gray-400 mb-3">Feature flags</h3>{flags.length === 0 ? <p className="text-sm text-gray-500">No governed flags returned.</p> : flags.map((flag) => <div key={flag.id} className="flex justify-between bg-[#121836] p-3 rounded border border-white/5"><span>{flag.key}</span><span className={flag.enabled ? 'text-green-400' : 'text-gray-400'}>{flag.enabled ? 'Enabled' : 'Disabled'} · {flag.environment}</span></div>)}</div></div>;
}

function SystemConfig({ config, onUpdate }: { config: any, onUpdate: (k: string, v: string) => void }) {
  const [localConfig, setConfig] = useState(config || {});

  const handleChange = (key: string, val: string) => {
    setConfig({ ...localConfig, [key]: val });
  };

  const handleSave = async (key: string) => {
    await onUpdate(key, localConfig[key]);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-400">Global Settings</h3>
      <div className="bg-[#121836] p-4 rounded-xl border border-white/5 space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Announcement Banner</label>
          <div className="flex gap-2">
            <input
              value={localConfig['banner_text'] || ''}
              onChange={(e) => handleChange('banner_text', e.target.value)}
              className="bg-[#0a0e27] border border-white/10 rounded px-3 py-2 text-sm flex-1"
            />
            <button onClick={() => handleSave('banner_text')} className="p-2 bg-[#00C076] rounded text-black"><Save size={16} /></button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Maintenance Mode</label>
          <div className="flex gap-2">
            <select
              value={localConfig['maintenance_mode'] || 'false'}
              onChange={(e) => {
                handleChange('maintenance_mode', e.target.value);
                handleSave('maintenance_mode'); // Auto save for select
              }}
              className="bg-[#0a0e27] border border-white/10 rounded px-3 py-2 text-sm flex-1"
            >
              <option value="false">Disabled (Live)</option>
              <option value="true">Enabled (Offline)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

function RiskManagement() {
  const [pairs, setPairs] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/risk/pairs').then(res => setPairs(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-400">Global Risk Control (House Win %)</h3>
      </div>
      {pairs.map(p => (
        <div key={p.id} className="bg-[#121836] p-4 rounded-xl border border-white/5 flex justify-between items-center">
          <div>
            <div className="font-bold text-white">{p.symbol}</div>
            <div className="text-xs text-gray-500">Default: 50%</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">House Win Rate:</span>
            <input
              type="number"
              defaultValue={p.houseWinRatio}
              disabled
              aria-label={`${p.symbol} sandbox outcome ratio (read only)`}
              className="w-16 bg-[#0a0e27] border border-white/10 rounded px-2 py-1 text-sm font-bold text-center text-[#FF4D4F]"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ totalVolume: 0, activeUsers: 0, globalPayoutRate: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({ onlineUsers: 0, totalConnections: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, configRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/system-config')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSystemConfig(configRes.data.config);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      router.replace('/admin/login');
      return;
    }
    fetchData();

    // Connect to Websocket for Live Admin Metrics
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token: localStorage.getItem('admin_token') },
    });

    socket.emit('join_admin');

    socket.on('systemMetrics', (data: any) => {
      setLiveMetrics({
        onlineUsers: data.onlineUsers,
        totalConnections: data.totalConnections
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const updateConfig = async (key: string, value: string) => {
    const reason = window.prompt('Reason required for this Admin configuration change:');
    if (!reason?.trim()) return;
    try {
      await api.post('/admin/system-config', { key, value, reason });
      alert('Config Saved');
    } catch (err) {
      alert('Failed');
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'risk', label: 'Risk', icon: ShieldAlert },
    { id: 'crypto', label: 'Crypto', icon: DollarSign },
    { id: 'mining', label: 'Mining', icon: Hammer },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'governance', label: 'Governance', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0e27] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#121836] border-b border-white/5 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <ArrowLeft size={24} className="text-gray-400" />
          </Link>
          <h1 className="text-lg font-bold text-[#00C076]">Admin Panel</h1>
        </div>
        <button onClick={fetchData} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-[#0a0e27]">
        <div className="bg-[#121836] p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
            <Activity size={10} className="text-[#00C076] animate-pulse" />
            LIVE
          </div>
          <div className="font-bold font-mono text-white">{liveMetrics.onlineUsers}</div>
        </div>
        <div className="bg-[#121836] p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] text-gray-400">Total Users</div>
          <div className="font-bold font-mono">{stats.activeUsers}</div>
        </div>
        <div className="bg-[#121836] p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] text-gray-400">Volume</div>
          <div className="font-bold font-mono text-[#00C076]">${(stats.totalVolume / 1000).toFixed(1)}k</div>
        </div>
        <div className="bg-[#121836] p-3 rounded-lg border border-white/5 text-center">
          <div className="text-[10px] text-gray-400">Payout</div>
          <div className="font-bold font-mono text-blue-400">{stats.globalPayoutRate}x</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto px-4 pb-2 gap-2 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[#00C076] text-black' : 'bg-[#121836] text-gray-400 border border-white/5'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1">
        {activeTab === 'users' && <UserManagement users={users} />}
        {activeTab === 'risk' && <RiskManagement />}
        {activeTab === 'crypto' && <CryptoManagement />}
        {activeTab === 'mining' && <MiningManagement />}
        {activeTab === 'loans' && <LoanManagement />}
        {activeTab === 'system' && <SystemConfig config={systemConfig} onUpdate={updateConfig} />}
        {activeTab === 'governance' && <GovernanceManagement />}
      </div>
    </div>
  );
}
