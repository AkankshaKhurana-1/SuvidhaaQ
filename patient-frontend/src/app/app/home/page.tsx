'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarPlus,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Bell,
} from 'lucide-react';

export default function PatientHomePage() {
  const { user } = useAuth();

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: async () => {
      const res = await api.get('/patients/dashboard');
      return res.data.data;
    },
    refetchInterval: 15000, // Auto refetch every 15s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const activeToken = dashboard?.activeToken;
  const appointments = dashboard?.appointments || [];

  // Steps definition for journey tracker
  const steps = [
    { key: 'PENDING', label: 'Booked', desc: 'Visit confirmed' },
    { key: 'ARRIVED', label: 'Arrived', desc: 'Checked in at desk' },
    { key: 'CALLED', label: 'Called', desc: 'Proceed to room' },
    { key: 'IN_CONSULTATION', label: 'Consulting', desc: 'With doctor' },
    { key: 'COMPLETED', label: 'Completed', desc: 'Prescription ready' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ARRIVED':
        return 1;
      case 'CALLED':
        return 2;
      case 'IN_CONSULTATION':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = activeToken ? getStepIndex(activeToken.status) : -1;

  return (
    <div className="space-y-8">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-900/10">
        <div>
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Hello, {user?.name || 'Patient'} 👋
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Welcome to SuvidhaaQ. Check your live OPD queue position or schedule a consultation with specialist doctors.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/app/book"
            className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4 text-emerald-700" />
            Book OPD Visit
          </Link>
        </div>
      </div>

      {/* Active Token Card & OPD Journey Tracker */}
      {activeToken ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-lg shadow-emerald-900/5 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
                {activeToken.code.split('-')[0]}
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Active Consultation Token
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeToken.doctor?.user?.name || 'Doctor'}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeToken.doctor?.department?.name || 'General OPD'} • Room {activeToken.doctor?.room || '101'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                  activeToken.status === 'CALLED'
                    ? 'bg-amber-100 text-amber-900 animate-pulse'
                    : activeToken.status === 'IN_CONSULTATION'
                    ? 'bg-blue-100 text-blue-900'
                    : activeToken.status === 'ARRIVED'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                STATUS: {activeToken.status}
              </span>
              <Link
                href="/app/live-queue"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                Track Live Queue
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Token Numbers Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs uppercase font-semibold text-slate-500">Your Token</span>
              <p className="text-3xl font-black text-emerald-700 mt-1">{activeToken.code}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs uppercase font-semibold text-slate-500">Queue Position</span>
              <p className="text-3xl font-black text-slate-800 mt-1">
                {activeToken.position > 0 ? `#${activeToken.position}` : 'Scheduled'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs uppercase font-semibold text-slate-500">Estimated Wait</span>
              <p className="text-3xl font-black text-slate-800 mt-1">
                ~{activeToken.estimatedWaitMinutes || 12} mins
              </p>
            </div>
          </div>

          {/* 5-Step OPD Journey Tracker */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              OPD Journey Progress
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                        : isPassed
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {idx + 1}
                        </span>
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-800">{step.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">No Active Visit Today</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              You do not have any tokens active in the queue right now. Book an appointment or check-in with your doctor below.
            </p>
          </div>
          <Link
            href="/app/book"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Book OPD Appointment
          </Link>
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Link
          href="/app/book"
          className="p-6 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
            Book OPD Visit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse hospital departments and choose an available specialist doctor.
          </p>
        </Link>

        <Link
          href="/app/live-queue"
          className="p-6 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
            Live Queue Board
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time consultation monitor, dynamic countdowns, and room alerts.
          </p>
        </Link>

        <Link
          href="/app/appointments"
          className="p-6 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition">
            My OPD Visits
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review past consultations, prescriptions, and token history.
          </p>
        </Link>
      </div>

      {/* Upcoming Appointments List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Appointments</h2>
            <p className="text-xs text-slate-500">Your scheduled and completed consultations</p>
          </div>
          <Link
            href="/app/appointments"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View All
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No appointments found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 4).map((apt: any) => (
              <div key={apt.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {apt.doctor?.user?.name || 'Doctor'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {apt.doctor?.department?.name} •{' '}
                    {new Date(apt.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                      apt.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : apt.status === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
