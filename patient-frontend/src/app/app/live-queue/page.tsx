'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Clock,
  AlertTriangle,
  UserCheck,
  MapPin,
  RefreshCw,
  BellRing,
  CheckCircle2,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LiveQueuePage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const {
    data: tokenData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['myToken'],
    queryFn: async () => {
      const res = await api.get('/patients/dashboard');
      return res.data.data?.activeToken;
    },
  });

  // Socket setup
  useEffect(() => {
    if (!tokenData) return;

    const socket = getSocket();
    const roomData = {
      hospitalId: tokenData.hospitalId,
      doctorId: tokenData.doctorId,
    };

    socket.emit('join:doctor', roomData);

    const handleUpdate = () => {
      refetch();
      setLastUpdated(new Date());
    };

    const handleCalled = (data: any) => {
      if (data.id === tokenData.id || data.code === tokenData.code) {
        toast.success(`🔔 TOKEN CALLED! Please proceed immediately to Room ${tokenData.doctor?.room || 'your doctor room'}!`, {
          duration: 10000,
        });
      }
      handleUpdate();
    };

    const handleEmergency = () => {
      toast.warning('⚠️ Emergency patient arrived and prioritized in queue.');
      handleUpdate();
    };

    socket.on('queue:update', handleUpdate);
    socket.on('token:called', handleCalled);
    socket.on('emergency:alert', handleEmergency);

    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('token:called', handleCalled);
      socket.off('emergency:alert', handleEmergency);
      socket.emit('leave:doctor', roomData);
    };
  }, [tokenData, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">No Active Queue Token</h1>
        <p className="text-sm text-slate-600">
          You don't have a token waiting in the live queue right now. You can book an appointment or check-in at the hospital front desk.
        </p>
        <Link
          href="/app/book"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Visit Now
        </Link>
      </div>
    );
  }

  const isCalled = tokenData.status === 'CALLED';
  const inConsultation = tokenData.status === 'IN_CONSULTATION';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Live OPD Queue Monitor
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </h1>
          <p className="text-xs text-slate-500">
            Real-time synchronization • Last update: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => {
            refetch();
            setLastUpdated(new Date());
          }}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Call Alert Banner if CALLED */}
      {isCalled && (
        <div className="p-6 rounded-3xl bg-amber-500 text-white shadow-xl shadow-amber-500/25 flex items-center gap-4 animate-bounce">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">YOUR TOKEN HAS BEEN CALLED!</h2>
            <p className="text-sm text-amber-100 mt-0.5">
              Please proceed immediately to Room {tokenData.doctor?.room || 'your doctor room'} for consultation with {tokenData.doctor?.user?.name}.
            </p>
          </div>
        </div>
      )}

      {/* Primary Live Token Card */}
      <div className="bg-white rounded-3xl p-8 border border-emerald-200/80 shadow-xl shadow-emerald-900/5 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          <span>OPD Priority Tier: {tokenData.tier}</span>
        </div>

        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-widest">
            Your Token Code
          </span>
          <p className="text-6xl font-black text-emerald-700 tracking-tight mt-1">
            {tokenData.code}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase">Queue Position</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {tokenData.position > 0 ? `${tokenData.position} in line` : isCalled ? 'CALLED' : 'Next'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase">Estimated Wait</span>
            <p className="text-3xl font-black text-emerald-800 mt-1">
              ~{tokenData.estimatedWaitMinutes || 10} mins
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-xs text-slate-500 font-semibold uppercase">Doctor Room</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {tokenData.doctor?.room || 'Room 101'}
            </p>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold">
              Dr
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{tokenData.doctor?.user?.name}</p>
              <p className="text-xs text-emerald-700 font-semibold">
                {tokenData.doctor?.specialization} • {tokenData.doctor?.department?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${
                tokenData.doctor?.available
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {tokenData.doctor?.available ? 'Doctor in Session' : 'On Brief Break'}
            </span>
            {tokenData.doctor?.sessionDelay > 0 && (
              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                +{tokenData.doctor.sessionDelay}m session delay factored in ETA
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Instructions */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          OPD Day Guidelines
        </h2>
        <ul className="list-disc pl-4 space-y-1 text-slate-600">
          <li>Check-in at the hospital front desk if you have not done so. The receptionist marks your arrival.</li>
          <li>Estimated wait times update dynamically as preceding consultations complete.</li>
          <li>Keep this screen open or check your phone — an audio chime and notification alerts you when called.</li>
        </ul>
      </div>
    </div>
  );
}
