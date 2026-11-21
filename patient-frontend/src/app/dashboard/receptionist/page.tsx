'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGuard } from '@/components/RoleGuard';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Search,
  Phone,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const [search, setSearch] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInAge, setWalkInAge] = useState<number | ''>('');
  const [walkInGender, setWalkInGender] = useState('Male');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDoctorId, setWalkInDoctorId] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Emergency form state
  const [emgName, setEmgName] = useState('');
  const [emgAge, setEmgAge] = useState<number | ''>('');
  const [emgGender, setEmgGender] = useState('Male');
  const [emgDoctorId, setEmgDoctorId] = useState('');
  const [emgReason, setEmgReason] = useState('Severe chest pain / respiratory distress');
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  // Live Queue Query
  const { data: queueData = [], isLoading, refetch } = useQuery({
    queryKey: ['receptionistLiveQueue'],
    queryFn: async () => {
      const res = await api.get('/queue/live');
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  // Doctors for selection
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorsList'],
    queryFn: async () => {
      const res = await api.get('/catalog/doctors');
      return res.data.data;
    },
  });

  // Socket listener
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => refetch();

    socket.on('queue:update', handleUpdate);
    socket.on('token:called', handleUpdate);
    socket.on('token:completed', handleUpdate);
    socket.on('token:arrived', handleUpdate);
    socket.on('emergency:alert', handleUpdate);

    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('token:called', handleUpdate);
      socket.off('token:completed', handleUpdate);
      socket.off('token:arrived', handleUpdate);
      socket.off('emergency:alert', handleUpdate);
    };
  }, [refetch]);

  // Actions
  const handleMarkArrived = async (tokenId: string) => {
    try {
      await api.post(`/queue/${tokenId}/arrive`);
      toast.success('Patient marked arrived at front desk');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark arrived');
    }
  };

  const handleMarkNoShow = async (tokenId: string) => {
    if (!confirm('Mark this patient as NO-SHOW? (Applies late penalty score)')) return;
    try {
      await api.post(`/queue/${tokenId}/no-show`);
      toast.info('Patient marked as NO-SHOW');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark no-show');
    }
  };

  const submitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone || walkInAge === '' || !walkInDoctorId) {
      toast.error('Please complete all walk-in fields');
      return;
    }
    setSubmittingWalkIn(true);
    try {
      const res = await api.post('/queue/walk-in', {
        name: walkInName,
        phone: walkInPhone,
        age: Number(walkInAge),
        gender: walkInGender,
        doctorId: walkInDoctorId,
      });
      toast.success(`Walk-in registered! Token issued: ${res.data.data.code}`);
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInAge('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to register walk-in');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const submitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emgName || emgAge === '' || !emgDoctorId || !emgReason) {
      toast.error('Please complete all emergency fields');
      return;
    }
    setSubmittingEmergency(true);
    try {
      const res = await api.post('/queue/emergency', {
        name: emgName,
        age: Number(emgAge),
        gender: emgGender,
        doctorId: emgDoctorId,
        reason: emgReason,
      });
      toast.success(`🚨 EMERGENCY TOKEN ISSUED: ${res.data.data.code} — Prioritized to Position #1`);
      setShowEmergencyModal(false);
      setEmgName('');
      setEmgAge('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to triage emergency');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['RECEPTIONIST', 'ADMIN']}>
      <div className="space-y-6">
        {/* Receptionist Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Front Desk Operations
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Receptionist OPD Queue Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-doctor queue board • Live arrivals check-in & emergency triage
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register Walk-In
            </button>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              Flag Emergency
            </button>
            <button
              onClick={() => refetch()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor OPD Queue Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queueData.map((doc: any) => (
              <div
                key={doc.doctorId}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
              >
                <div>
                  {/* Doctor Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.doctorName}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {doc.department} • Room {doc.room}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          doc.available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.available ? 'In Clinic' : 'Unavailable'}
                      </span>
                      {doc.sessionDelay > 0 && (
                        <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                          +{doc.sessionDelay}m delay
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Patient */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Currently Inside Room
                    </span>
                    {doc.activePatient ? (
                      <div className="flex items-center justify-between mt-1">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {doc.activePatient.patientName}
                          </p>
                          <span className="text-xs font-black text-emerald-700">
                            {doc.activePatient.code}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                          IN CONSULTATION
                        </span>
                      </div>
                    ) : doc.calledPatient ? (
                      <div className="flex items-center justify-between mt-1">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {doc.calledPatient.patientName}
                          </p>
                          <span className="text-xs font-black text-amber-600">
                            {doc.calledPatient.code}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                          CALLED TO ROOM
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1 italic">Room available</p>
                    )}
                  </div>

                  {/* Waiting Queue List */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Waiting Patients ({doc.totalWaiting})</span>
                      <span className="text-slate-400 font-normal">Dynamic priority sorted</span>
                    </div>

                    {doc.waitingQueue.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center italic">
                        No arrived patients waiting
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {doc.waitingQueue.map((item: any) => (
                          <div
                            key={item.tokenId}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{item.patientName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                                  {item.code}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Score: {item.score} • ETA: ~{item.estimatedWaitMinutes}m
                              </span>
                            </div>

                            <button
                              onClick={() => handleMarkNoShow(item.tokenId)}
                              title="Mark No-Show"
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 bg-white hover:bg-rose-50 rounded border border-rose-200"
                            >
                              No-Show
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Register Walk-In */}
        {showWalkInModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Register Front Desk Walk-In
                </h3>
                <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitWalkIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Age"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={walkInGender}
                      onChange={(e) => setWalkInGender(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Doctor</label>
                  <select
                    required
                    value={walkInDoctorId}
                    onChange={(e) => setWalkInDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.user?.name} ({d.specialization} • Room {d.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWalkIn}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    {submittingWalkIn ? 'Issuing...' : 'Generate Walk-In Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Flag Emergency */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                  Flag Critical Emergency (Tier 1 Priority)
                </h3>
                <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitEmergency} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={emgName}
                    onChange={(e) => setEmgName(e.target.value)}
                    placeholder="Emergency Patient Name"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={emgAge}
                      onChange={(e) => setEmgAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Age"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={emgGender}
                      onChange={(e) => setEmgGender(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Triage Reason</label>
                  <textarea
                    rows={2}
                    required
                    value={emgReason}
                    onChange={(e) => setEmgReason(e.target.value)}
                    placeholder="Reason for immediate doctor triage"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Doctor</label>
                  <select
                    required
                    value={emgDoctorId}
                    onChange={(e) => setEmgDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.user?.name} ({d.specialization} • Room {d.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEmergency}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
                  >
                    {submittingEmergency ? 'Prioritizing...' : 'Triage Immediately'}
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
