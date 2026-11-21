'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Activity,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  User,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

export default function UnifiedLoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      // toast shown in context
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'patient' | 'admin' | 'reception' | 'doctor') => {
    setActiveDemo(role);
    if (role === 'patient') {
      setIdentifier('9000000001');
      setPassword('Patient@123');
    } else if (role === 'admin') {
      setIdentifier('admin@suvidhaaq.demo');
      setPassword('Admin@123');
    } else if (role === 'reception') {
      setIdentifier('reception@suvidhaaq.demo');
      setPassword('Reception@123');
    } else if (role === 'doctor') {
      setIdentifier('doctor@suvidhaaq.demo');
      setPassword('Doctor@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          SuvidhaaQ Universal Portal
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in whether you are a <strong>Patient</strong>, <strong>Doctor</strong>, <strong>Receptionist</strong>, or <strong>Admin</strong>.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {/* 1-Click Quick Demo Switcher */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              1-Click Demo Accounts (Label: Demo data)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border shadow-sm ${
                  activeDemo === 'patient'
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-500" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('reception')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border shadow-sm ${
                  activeDemo === 'reception'
                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Reception</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('doctor')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border shadow-sm ${
                  activeDemo === 'doctor'
                    ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50/50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-500" />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border shadow-sm ${
                  activeDemo === 'admin'
                    ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Admin</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-2.5">
              Click any button above to auto-fill that role's credentials instantly!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (Patients) or Email (Staff)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {identifier.includes('@') ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9000000001 or admin@suvidhaaq.demo"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setActiveDemo(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              New patient?{' '}
              <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
                Self-register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
