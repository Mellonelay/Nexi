'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [kycData, setKycData] = useState({ firstName: '', lastName: '', country: '', documentType: 'PASSPORT', documentUrl: '' });
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      fetchKycStatus(u.id);
    }
  }, []);

  const fetchKycStatus = async (userId: string) => {
    try {
      const res = await api.get(`/kyc/status/${userId}`);
      setKycStatus(res.data.status || 'NOT_SUBMITTED');
    } catch (err) {
      console.error(err);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.post('/kyc/submit', { userId: user.id, ...kycData });
      alert('KYC Submitted Successfully');
      fetchKycStatus(user.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission Failed');
    }
  };

  return (
    <div className="min-h-screen bg-dexi-dark text-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 gradient-text">Settings</h1>

          <div className="flex gap-4 mb-8 border-b border-dexi-purple/20">
            {['profile', 'security', 'kyc', 'notifications', 'preferences'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'border-b-2 border-dexi-cyan text-dexi-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="card-dark p-6">
                <h2 className="text-2xl font-bold mb-6 text-dexi-cyan">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-cyan focus:outline-none transition-colors"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-cyan focus:outline-none transition-colors"
                      placeholder="Enter email"
                    />
                  </div>
                  <button className="px-6 py-3 bg-gradient-dexi text-white font-semibold rounded-lg hover:shadow-neon-blue transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="card-dark p-6">
                <h2 className="text-2xl font-bold mb-6 text-dexi-purple">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-purple focus:outline-none transition-colors"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-purple focus:outline-none transition-colors"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-purple focus:outline-none transition-colors"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="px-6 py-3 bg-dexi-purple text-white font-semibold rounded-lg hover:shadow-neon-purple transition-all">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="card-dark p-6">
                <h3 className="text-xl font-bold mb-4 text-dexi-cyan">Two-Factor Authentication</h3>
                <p className="text-gray-400 mb-4">
                  Add an extra layer of security to your account
                </p>
                <button className="px-6 py-3 bg-dexi-cyan text-dexi-dark font-semibold rounded-lg hover:bg-dexi-blue transition-colors">
                  Enable 2FA
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'kyc' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card-dark p-6">
                <h2 className="text-2xl font-bold mb-6 text-dexi-green">Identity Verification</h2>
                
                <div className="mb-6 p-4 bg-dexi-darker rounded-lg border border-gray-700">
                    <span className="text-gray-400">Current Status: </span>
                    <span className={`font-bold ${kycStatus === 'APPROVED' ? 'text-green-500' : kycStatus === 'PENDING' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {kycStatus}
                    </span>
                </div>

                {kycStatus !== 'APPROVED' && (
                    <form onSubmit={handleKycSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-300">First Name</label>
                                <input
                                    value={kycData.firstName}
                                    onChange={e => setKycData({...kycData, firstName: e.target.value})}
                                    className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-300">Last Name</label>
                                <input
                                    value={kycData.lastName}
                                    onChange={e => setKycData({...kycData, lastName: e.target.value})}
                                    className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg text-white"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-300">Country</label>
                            <input
                                value={kycData.country}
                                onChange={e => setKycData({...kycData, country: e.target.value})}
                                className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-300">Document Type</label>
                            <select
                                value={kycData.documentType}
                                onChange={e => setKycData({...kycData, documentType: e.target.value})}
                                className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg text-white"
                            >
                                <option value="PASSPORT">Passport</option>
                                <option value="ID_CARD">National ID</option>
                                <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-300">Document Image URL (Mock)</label>
                            <input
                                value={kycData.documentUrl}
                                onChange={e => setKycData({...kycData, documentUrl: e.target.value})}
                                className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg text-white"
                                placeholder="https://example.com/my-id.jpg"
                                required
                            />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-dexi-green text-dexi-dark font-bold rounded-lg hover:opacity-90 transition-all w-full">
                            Submit for Verification
                        </button>
                    </form>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="card-dark p-6">
                <h2 className="text-2xl font-bold mb-6 text-dexi-blue">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Trade Notifications', desc: 'Get notified when your trades are executed' },
                    { label: 'Price Alerts', desc: 'Receive alerts for significant price changes' },
                    { label: 'Account Activity', desc: 'Notifications for login and security events' },
                    { label: 'Marketing Emails', desc: 'Receive updates about new features and promotions' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-dexi-darker rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-sm text-gray-400">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dexi-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dexi-blue"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="card-dark p-6">
                <h2 className="text-2xl font-bold mb-6 text-dexi-pink">Trading Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Default Trading Pair
                    </label>
                    <select className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-pink focus:outline-none transition-colors">
                      <option>BTC/USDT</option>
                      <option>ETH/USDT</option>
                      <option>LTC/USDT</option>
                      <option>XRP/USDT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Chart Theme
                    </label>
                    <select className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-pink focus:outline-none transition-colors">
                      <option>Dark</option>
                      <option>Light</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Language
                    </label>
                    <select className="w-full px-4 py-3 bg-dexi-darker border border-dexi-purple/20 rounded-lg focus:border-dexi-pink focus:outline-none transition-colors">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Chinese</option>
                    </select>
                  </div>
                  <button className="px-6 py-3 bg-dexi-pink text-white font-semibold rounded-lg hover:shadow-neon-purple transition-all">
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
