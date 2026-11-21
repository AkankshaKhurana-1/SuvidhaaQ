'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, Mail, Lock, ArrowRight, Loader2, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';

export default function StaffLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // toast shown in context
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'reception' | 'doctor') => {
    if (role === 'admin') {
      setEmail('admin@suvidhaaq.demo');
      setPassword('Admin@123');
    } else if (role === 'reception') {
      setEmail('reception@suvidhaaq.demo');
      setPassword('Reception@123');
    } else if (role === 'doctor') {
      setEmail('doctor@suvidhaaq.demo');
      setPassword('Doctor@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mx-auto mb-4">
          <Activity className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Hospital Staff Portal
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          SuvidhaaQ OPD Operations & Clinical Workstation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80">
          {/* 1-Click Demo Fillers */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-700">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Demo Data — Quick Staff Fill
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 flex items-center justify-center gap-1 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('reception')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 flex items-center justify-center gap-1 transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Reception
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('doctor')}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 flex items-center justify-center gap-1 transition"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                Doctor
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@suvidhaaq.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/80 text-center">
            <p className="text-xs text-slate-400">
              Staff accounts are created by Hospital Admins.
              <br />
              Patients should use the{' '}
              <a
                href="/"
                className="font-bold text-emerald-400 hover:underline"
              >
                Patient Portal
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
