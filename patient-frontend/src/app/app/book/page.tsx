'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Building2,
  Stethoscope,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function BookVisitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [hospitalId, setHospitalId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [visitType, setVisitType] = useState<'NEW' | 'FOLLOW_UP'>('NEW');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('10:00');

  // Patient details state
  const [isFamilyMember, setIsFamilyMember] = useState(false);
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState<number | ''>(32);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const res = await api.get('/catalog/hospitals');
      return res.data.data;
    },
  });

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', hospitalId],
    queryFn: async () => {
      if (!hospitalId) return [];
      const res = await api.get(`/catalog/hospitals/${hospitalId}/departments`);
      return res.data.data;
    },
    enabled: !!hospitalId,
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', hospitalId, departmentId],
    queryFn: async () => {
      if (!hospitalId) return [];
      const res = await api.get('/catalog/doctors', {
        params: { hospitalId, departmentId: departmentId || undefined },
      });
      return res.data.data;
    },
    enabled: !!hospitalId,
  });

  const handleNextStep = () => {
    if (step === 1 && !hospitalId) {
      toast.error('Please select a hospital');
      return;
    }
    if (step === 2 && !departmentId) {
      toast.error('Please select a department');
      return;
    }
    if (step === 3 && !doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBookVisit = async () => {
    if (!patientName || !patientPhone || patientAge === '') {
      toast.error('Please fill all patient details');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00.000Z`).toISOString();

      const payload = {
        hospitalId,
        doctorId,
        scheduledAt,
        type: visitType,
        patientDetails: {
          name: patientName,
          phone: patientPhone,
          age: Number(patientAge),
          gender: patientGender,
          isFamilyMember,
        },
      };

      const res = await api.post('/patients', payload);
      const token = res.data.data.token || res.data.data;

      toast.success(`Visit booked successfully! Token allocated: ${token.code || token.tokenCode}`);
      router.push('/app/home');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to book visit';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Book Specialist OPD Visit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Follow the steps below to reserve an appointment and generate your priority queue token.
        </p>

        <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-4">
          {[
            { num: 1, title: 'Hospital' },
            { num: 2, title: 'Department' },
            { num: 3, title: 'Doctor' },
            { num: 4, title: 'Schedule' },
            { num: 5, title: 'Patient' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : s.num}
              </div>
              <span className="text-[11px] font-semibold text-slate-600 mt-1.5 hidden sm:block">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Hospital */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Step 1: Choose Hospital
          </h2>

          {loadingHospitals ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {hospitals.map((h: any) => (
                <div
                  key={h.id}
                  onClick={() => setHospitalId(h.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    hospitalId === h.id
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    {h.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{h.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{h.address}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              Next: Select Department
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Department */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Step 2: Choose Department
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {loadingDepts ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {departments.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => setDepartmentId(d.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    departmentId === d.id
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <h3 className="text-base font-bold text-slate-900">{d.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{d.location || 'Main Hospital Wing'}</p>
                  <span className="inline-block mt-3 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md">
                    Cap: {d.dailyCapacity} visits/day
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              Next: Select Doctor
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Doctor */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Step 3: Select Specialist Doctor
            </h2>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {loadingDoctors ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No doctors available in this department. Please choose another department.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map((doc: any) => (
                <div
                  key={doc.id}
                  onClick={() => setDoctorId(doc.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    doctorId === doc.id
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.user?.name}</h3>
                      <p className="text-xs text-emerald-700 font-semibold">{doc.specialization}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        doc.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.available ? 'Available' : 'On Leave'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Room: {doc.room}</span>
                    <span>Slot: ~{doc.consultationMinutes || 15} mins</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              Next: Choose Schedule
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Schedule & Type */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Step 4: Visit Schedule & Consultation Type
            </h2>
            <button
              onClick={() => setStep(3)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Consultation Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setVisitType('NEW')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    visitType === 'NEW'
                      ? 'border-emerald-600 bg-emerald-50/60 font-bold'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">New Consultation</p>
                  <p className="text-xs text-slate-500 mt-1">15 mins duration • Tier 3 priority</p>
                </div>
                <div
                  onClick={() => setVisitType('FOLLOW_UP')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    visitType === 'FOLLOW_UP'
                      ? 'border-emerald-600 bg-emerald-50/60 font-bold'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">Follow-up Visit</p>
                  <p className="text-xs text-slate-500 mt-1">8 mins duration • Tier 4 priority</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Consultation Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Time Slot
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="09:00">09:00 AM - Morning Slot</option>
                  <option value="10:00">10:00 AM - Morning Slot</option>
                  <option value="11:00">11:00 AM - Morning Slot</option>
                  <option value="14:00">02:00 PM - Afternoon Slot</option>
                  <option value="15:00">03:00 PM - Afternoon Slot</option>
                  <option value="16:00">04:00 PM - Evening Slot</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              Next: Patient Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Patient Details & Confirm */}
      {step === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Step 5: Patient Details & Priority Engine Allocation
            </h2>
            <button
              onClick={() => setStep(4)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="bookingTarget"
                checked={!isFamilyMember}
                onChange={() => {
                  setIsFamilyMember(false);
                  setPatientName(user?.name || '');
                  setPatientPhone(user?.phone || '');
                }}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              Book for Myself
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="bookingTarget"
                checked={isFamilyMember}
                onChange={() => {
                  setIsFamilyMember(true);
                  setPatientName('');
                }}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              Book for Family Member
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Patient Name
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Patient Phone
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Patient Age {Number(patientAge) >= 60 && '— (Senior Citizen Priority Tier 2 Applied!)'}
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={handleBookVisit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Allocating Token...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Generate Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
