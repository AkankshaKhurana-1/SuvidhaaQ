'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Ban,
  CheckCircle2,
  Loader2,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyAppointmentsPage() {
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: async () => {
      const res = await api.get('/patients/appointments');
      return res.data.data;
    },
  });

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this visit?')) return;
    try {
      await api.post(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel appointment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My OPD Consultations</h1>
          <p className="text-xs text-slate-500">History of your hospital visits and active bookings</p>
        </div>
        <Link
          href="/app/book"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Visit
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Appointments Recorded</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not booked any hospital OPD consultations yet.
          </p>
          <Link
            href="/app/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Your First Visit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt: any) => {
            const isCancellable = apt.status === 'SCHEDULED' || apt.status === 'PENDING';
            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    {apt.token?.code || 'TOKEN'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {apt.doctor?.user?.name || 'Doctor'}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          apt.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                        {apt.doctor?.department?.name || 'General OPD'}
                      </span>
                      <span>• Room: {apt.doctor?.room || '101'}</span>
                    </p>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(apt.scheduledAt).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                    <Link
                      href="/app/live-queue"
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Track Queue
                    </Link>
                  )}
                  {isCancellable && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
