'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGuard } from '@/components/RoleGuard';
import { toast } from 'sonner';
import {
  Stethoscope,
  Play,
  CheckCircle2,
  BellRing,
  Clock,
  User,
  FileText,
  Calendar,
  AlertCircle,
  RefreshCw,
  Power,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function DoctorWorkstationDashboard() {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Doctor Workstation Query
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['doctorQueue'],
    queryFn: async () => {
      const res = await api.get('/doctor/queue');
      return res.data.data;
    },
    refetchInterval: 8000,
  });

  // Doctor History Query
  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['doctorHistory'],
    queryFn: async () => {
      const res = await api.get('/doctor/history');
      return res.data.data;
    },
  });

  const currentPatient = queueData?.currentPatient;

  // Running consultation timer
  useEffect(() => {
    let interval: any;
    if (currentPatient && currentPatient.startedAt && !currentPatient.isCalled) {
      const started = new Date(currentPatient.startedAt).getTime();
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentPatient]);

  // Sockets for real-time updates
  useEffect(() => {
    if (!queueData?.doctorId) return;
    const socket = getSocket();
    const handleUpdate = () => {
      refetch();
      refetchHistory();
    };

    socket.on('queue:update', handleUpdate);
    socket.on('emergency:alert', (token) => {
      toast.warning(`🚨 EMERGENCY ALERT: Patient ${token.code} queued immediately!`);
      handleUpdate();
    });

    return () => {
      socket.off('queue:update', handleUpdate);
    };
  }, [queueData?.doctorId, refetch, refetchHistory]);

  // Actions
  const handleCallNext = async () => {
    try {
      const res = await api.post('/doctor/call-next');
      if (res.data.data?.message) {
        toast.info(res.data.data.message);
      } else {
        toast.success(`Called patient ${res.data.data.code} into consultation room.`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to call next patient');
    }
  };

  const handleStartConsultation = async (tokenId: string) => {
    try {
      await api.post(`/doctor/${tokenId}/start`);
      toast.success('Consultation timer started.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to start consultation');
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient?.tokenId || !notes) {
      toast.error('Please enter clinical notes');
      return;
    }
    setSubmittingComplete(true);
    try {
      await api.post(`/doctor/${currentPatient.tokenId}/complete`, {
        notes,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });
      toast.success('Consultation completed and clinical summary saved!');
      setShowCompleteModal(false);
      setNotes('');
      setFollowUpDate('');
      refetch();
      refetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to complete consultation');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await api.put('/doctor/availability', {
        available: !queueData?.available,
      });
      toast.success(`Status updated: ${!queueData?.available ? 'Available' : 'On Break'}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update availability');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <RoleGuard allowedRoles={['DOCTOR']}>
      <div className="space-y-6">
        {/* Top Workstation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Clinical Workstation
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {queueData?.doctorName || 'Doctor'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {queueData?.department} • Room {queueData?.room}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                queueData?.available
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {queueData?.available ? 'In Clinic (Available)' : 'On Break'}
            </button>
            <button
              onClick={() => {
                refetch();
                refetchHistory();
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Seen Today</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {queueData?.summary?.seenToday ?? 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Waiting in Queue</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {queueData?.summary?.remainingInQueue ?? 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Session Delay</span>
            <p
              className={`text-2xl font-black mt-1 ${
                (queueData?.summary?.sessionDelayMinutes || 0) > 0 ? 'text-amber-600' : 'text-slate-700'
              }`}
            >
              {queueData?.summary?.sessionDelayMinutes ?? 0}m
            </p>
          </div>
        </div>

        {/* Main Grid: Active Patient & Up Next */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Active Patient Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Consultation Focus
                </span>
                {currentPatient ? (
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      currentPatient.isCalled
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentPatient.isCalled ? 'PATIENT CALLED' : 'CONSULTATION IN PROGRESS'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Idle</span>
                )}
              </div>

              {currentPatient ? (
                <div className="mt-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-3xl font-black text-emerald-700">
                        {currentPatient.code}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">
                        {currentPatient.patientName}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {currentPatient.age} yrs • {currentPatient.gender} • Type: {currentPatient.visitType}
                      </p>
                    </div>

                    {/* Timer Box */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white text-center min-w-[120px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                      <p className="text-2xl font-mono font-black text-emerald-400 mt-0.5">
                        {currentPatient.isCalled ? '--:--' : formatTimer(elapsedSeconds)}
                      </p>
                    </div>
                  </div>

                  {currentPatient.hasLabReady && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Lab Reports Available: Results ready for review in locker.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Patient in Room</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Queue is ready. Click "Call Next Patient" to summon the highest priority arrived patient.
                  </p>
                </div>
              )}
            </div>

            {/* Workstation Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
              {currentPatient?.isCalled ? (
                <button
                  onClick={() => handleStartConsultation(currentPatient.tokenId)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Patient Entered — Start Consultation
                </button>
              ) : currentPatient ? (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  End & Save Consultation
                </button>
              ) : (
                <button
                  onClick={handleCallNext}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4" />
                  Call Next Patient
                </button>
              )}
            </div>
          </div>

          {/* Up Next Queue */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Up Next in Line (Next 5)
              </h3>
              <span className="text-[11px] text-slate-400">Dynamic Score Order</span>
            </div>

            {(!queueData?.upNext || queueData.upNext.length === 0) ? (
              <p className="text-xs text-slate-400 py-12 text-center italic">
                No arrived patients waiting in line.
              </p>
            ) : (
              <div className="space-y-2">
                {queueData.upNext.map((p: any, idx: number) => (
                  <div
                    key={p.tokenId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{p.patientName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                          {p.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tier: {p.tier} • Score: {p.score} • Wait: ~{p.estimatedWaitMinutes}m
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Complete Consultation */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Complete Consultation — {currentPatient?.patientName}
                  </h3>
                  <p className="text-xs text-slate-500">Token: {currentPatient?.code}</p>
                </div>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteConsultation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Notes & Prescriptions
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Diagnosis, prescribed medications, dosages, and clinical advice..."
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recommended Follow-Up Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComplete}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    {submittingComplete ? 'Saving...' : 'Finish & Next'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
