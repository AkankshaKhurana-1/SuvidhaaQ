'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RoleGuard } from '@/components/RoleGuard';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  Stethoscope,
  ShieldCheck,
  Activity,
  Clock,
  UserPlus,
  Sliders,
  History,
  CheckCircle2,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'staff' | 'capacity' | 'audit'>('overview');

  // Staff creation state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('Password@123');
  const [staffRole, setStaffRole] = useState<'RECEPTIONIST' | 'DOCTOR' | 'ADMIN'>('RECEPTIONIST');
  const [staffDeptId, setStaffDeptId] = useState('');
  const [staffRoom, setStaffRoom] = useState('Room 101');
  const [staffSpec, setStaffSpec] = useState('General');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Capacity quota state
  const [capDeptId, setCapDeptId] = useState('');
  const [newQuota, setNewQuota] = useState(50);
  const [followUpQuota, setFollowUpQuota] = useState(30);
  const [walkInQuota, setWalkInQuota] = useState(20);
  const [savingCapacity, setSavingCapacity] = useState(false);

  // Queries
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const res = await api.get('/admin/overview');
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: deptLoad = [], refetch: refetchDeptLoad } = useQuery({
    queryKey: ['adminDeptLoad'],
    queryFn: async () => {
      const res = await api.get('/admin/departments/load');
      return res.data.data;
    },
  });

  const { data: doctors = [], refetch: refetchRoster } = useQuery({
    queryKey: ['adminDoctors'],
    queryFn: async () => {
      const res = await api.get('/admin/doctors');
      return res.data.data;
    },
  });

  const { data: staffList = [], refetch: refetchStaff } = useQuery({
    queryKey: ['adminStaff'],
    queryFn: async () => {
      const res = await api.get('/admin/staff');
      return res.data.data;
    },
  });

  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data.data;
    },
  });

  // Actions
  const handleToggleDoctorStatus = async (doctorId: string, current: boolean) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}`, { available: !current });
      toast.success('Doctor availability updated');
      refetchRoster();
    } catch (err: any) {
      toast.error('Failed to update doctor roster');
    }
  };

  const handleResetDelay = async (doctorId: string) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}`, { sessionDelay: 0 });
      toast.success('Doctor session delay reset to 0');
      refetchRoster();
    } catch (err: any) {
      toast.error('Failed to reset delay');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStaff(true);
    try {
      await api.post('/admin/staff', {
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword,
        role: staffRole,
        departmentId: staffRole === 'DOCTOR' ? staffDeptId : undefined,
        room: staffRole === 'DOCTOR' ? staffRoom : undefined,
        specialization: staffRole === 'DOCTOR' ? staffSpec : undefined,
      });
      toast.success('Staff account created successfully!');
      setShowStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      refetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create staff');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capDeptId) {
      toast.error('Please select a department');
      return;
    }
    const sum = Number(newQuota) + Number(followUpQuota) + Number(walkInQuota);
    if (sum !== 100) {
      toast.error(`Quotas must sum to exactly 100% (currently ${sum}%)`);
      return;
    }
    setSavingCapacity(true);
    try {
      await api.post('/admin/capacity', {
        departmentId: capDeptId,
        newQuota: Number(newQuota),
        followUpQuota: Number(followUpQuota),
        walkInQuota: Number(walkInQuota),
      });
      toast.success('Department capacity quotas saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update capacity');
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        {/* Command Center Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Hospital Operations Command Center
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Administration Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live footfall KPIs • Staffing • Capacity Split • Multi-Department Orchestration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchOverview();
                refetchDeptLoad();
                refetchRoster();
                refetchStaff();
                refetchAudit();
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh All"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit">
          {[
            { id: 'overview', label: 'Command Overview', icon: Activity },
            { id: 'roster', label: 'Doctor Roster', icon: Stethoscope },
            { id: 'staff', label: 'Staff Management', icon: Users },
            { id: 'capacity', label: 'Capacity Settings', icon: Sliders },
            { id: 'audit', label: 'Audit Logs', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview KPIs & Dept Breakdown */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Today's Footfall</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {overview?.footfallToday ?? 0}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Consultations</span>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {overview?.activeConsultations ?? 0}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Waiting in OPD</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {overview?.waitingPatients ?? 0}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed Today</span>
                <p className="text-2xl font-black text-teal-700 mt-1">
                  {overview?.completedToday ?? 0}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Delayed Doctors</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {overview?.delayedDoctors ?? 0}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Wait Time</span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  ~{overview?.avgWaitMinutes ?? 12}m
                </p>
              </div>
            </div>

            {/* Department Load Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Department Load Breakdown
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Doctors</th>
                      <th className="py-3 px-4">Waiting</th>
                      <th className="py-3 px-4">In Consultation</th>
                      <th className="py-3 px-4">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {deptLoad.map((d: any) => (
                      <tr key={d.departmentId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{d.departmentName}</td>
                        <td className="py-3 px-4 text-slate-500">{d.location || 'Wing A'}</td>
                        <td className="py-3 px-4">{d.doctorsCount} active</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{d.waiting}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{d.inConsultation}</td>
                        <td className="py-3 px-4 text-slate-600">{d.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Doctor Roster */}
        {activeTab === 'roster' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Doctor Roster & Live Status Control
            </h2>

            <div className="divide-y divide-slate-100">
              {doctors.map((doc: any) => (
                <div key={doc.doctorId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                      <span className="text-xs text-slate-500">• Room {doc.room}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          doc.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      {doc.specialization} • {doc.department}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Current Queue: <strong>{doc.activeQueueCount}</strong> patients • Session Delay:{' '}
                      <strong className={doc.sessionDelay > 0 ? 'text-amber-600' : 'text-slate-700'}>
                        {doc.sessionDelay} mins
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDoctorStatus(doc.doctorId, doc.available)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                    >
                      {doc.available ? 'Toggle Off' : 'Toggle On'}
                    </button>
                    {doc.sessionDelay > 0 && (
                      <button
                        onClick={() => handleResetDelay(doc.doctorId)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200"
                      >
                        Reset Delay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Staff Management */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Hospital Staff Accounts ({staffList.length})
              </h2>
              <button
                onClick={() => setShowStaffModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Staff Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staffList.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4">{s.email}</td>
                      <td className="py-3 px-4">{s.phone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 font-bold text-[10px] rounded">
                          {s.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Capacity Settings */}
        {activeTab === 'capacity' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Department Capacity Split
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure patient quota distribution. Must sum to exactly 100%.
              </p>
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                <select
                  required
                  value={capDeptId}
                  onChange={(e) => setCapDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Choose department...</option>
                  {deptLoad.map((d: any) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Consult (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newQuota}
                    onChange={(e) => setNewQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Follow-Up (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={followUpQuota}
                    onChange={(e) => setFollowUpQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Walk-In (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={walkInQuota}
                    onChange={(e) => setWalkInQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Total Sum:</span>
                <span
                  className={`font-black ${
                    Number(newQuota) + Number(followUpQuota) + Number(walkInQuota) === 100
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {Number(newQuota) + Number(followUpQuota) + Number(walkInQuota)}% / 100%
                </span>
              </div>

              <button
                type="submit"
                disabled={savingCapacity}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {savingCapacity ? 'Saving...' : 'Save Capacity Quotas'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Immutable Audit Log Trail ({auditData?.total ?? 0})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(auditData?.logs || []).map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{l.action}</td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold rounded">
                          {l.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{l.entity}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add Staff */}
        {showStaffModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Add Staff Account</h3>
                <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Name</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="staff@suvidhaaq.demo"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="10-digit phone"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {staffRole === 'DOCTOR' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <select
                        required
                        value={staffDeptId}
                        onChange={(e) => setStaffDeptId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">Select Department...</option>
                        {deptLoad.map((d: any) => (
                          <option key={d.departmentId} value={d.departmentId}>
                            {d.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Room</label>
                        <input
                          type="text"
                          required
                          value={staffRoom}
                          onChange={(e) => setStaffRoom(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                        <input
                          type="text"
                          required
                          value={staffSpec}
                          onChange={(e) => setStaffSpec(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStaff}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    {submittingStaff ? 'Creating...' : 'Create Staff Member'}
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
