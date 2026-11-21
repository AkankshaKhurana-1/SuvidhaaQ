'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Stethoscope,
  Activity,
  Receipt,
  User,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Sparkles,
  Building2,
  Lock,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07241a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Glows matching reference screenshot */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-emerald-600/25 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-10 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-20 left-1/3 w-[550px] h-[550px] bg-teal-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-50 max-w-7xl w-full mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-[#07241a] font-black text-lg shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center">
            SuvidhaaQ
          </span>
        </Link>

        {/* Center Nav Links matching screenshot */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-100/70">
          <a href="#roles" className="hover:text-white transition-colors">
            Roles
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Security
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-emerald-100/90 hover:text-white transition-colors px-2 py-1"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-16 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline and Pitch */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge: Live across 200+ hospitals */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live across 200+ hospitals</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-white tracking-tight leading-[1.08]">
                The operating <br />
                system for <br />
                modern hospitals.
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-emerald-100/75 max-w-xl font-normal leading-relaxed pt-1">
                Run the front desk, the OPD floor, and every doctor's room from one real-time system.
                Cut wait times. See every token. Bill on the spot.
              </p>

              {/* CTA Button */}
              <div className="pt-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-[#07241a] font-bold text-sm shadow-xl hover:bg-emerald-50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Start 15-day free trial</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>

              {/* Compliance Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-emerald-400/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>HIPAA · ABDM ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>99.99% uptime</span>
                </div>
              </div>
            </div>

            {/* Right Column: Phone Mockup with Floating Badges */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
              <div className="relative w-full max-w-[340px] sm:max-w-[360px]">
                {/* Floating Badge 1 (Top Right): REGISTRATION COMPLETE */}
                <div className="absolute -top-6 -right-3 sm:-right-8 z-30 bg-white text-slate-800 rounded-2xl p-3.5 shadow-2xl border border-slate-100 max-w-[215px]">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px]">
                      ✓
                    </span>
                    Registration Complete
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Priya Sharma</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Front Desk 2 · Jane Doe · 08:15 AM
                  </p>
                </div>

                {/* Floating Badge 2 (Middle Left): TOKEN ISSUED */}
                <div className="absolute top-[38%] -left-6 sm:-left-12 z-30 bg-white text-slate-800 rounded-2xl p-3.5 shadow-2xl border border-slate-100 max-w-[220px]">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-[10px] font-bold">
                      H
                    </span>
                    Token Issued
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    A-046 · Priya Sharma
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Dr. Sarah Smith · Cardiology · Room 104
                  </p>
                </div>

                {/* Phone Body */}
                <div className="w-full bg-white rounded-[40px] p-6 shadow-2xl shadow-emerald-950/70 border-4 border-slate-200/50 relative z-20 text-slate-800">
                  {/* Phone Header */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
                      <span className="tracking-wider">TOKEN JOURNEY</span>
                      <span>08:15 AM</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          A-046
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Dr. Sarah Smith · Cardiology · Room 104
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Journey Timeline List with connecting lines */}
                  <div className="py-4 space-y-4 relative">
                    {/* Step 1: Registration */}
                    <div className="flex items-start gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 z-10">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">
                            Registration & Token Issued
                          </p>
                          <span className="text-[10px] text-slate-400">08:15 AM</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Front Desk 2 · Jane Doe</p>
                      </div>
                    </div>

                    {/* Step 2: Waiting Area */}
                    <div className="flex items-start gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">Waiting Area B</p>
                          <span className="text-[10px] text-slate-400">08:30 AM</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Cardiology waiting area · Wt: 72kg</p>
                      </div>
                    </div>

                    {/* Step 3: Called by Doctor */}
                    <div className="flex items-start gap-3 opacity-60 relative">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-700">Called by Doctor</p>
                          <span className="text-[10px] text-slate-300">--</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Room 104 · Dr. Sarah Smith</p>
                      </div>
                    </div>

                    {/* Step 4: In Consultation */}
                    <div className="flex items-start gap-3 opacity-60 relative">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-700">In Consultation</p>
                          <span className="text-[10px] text-slate-300">--</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Cardiology · Room 104</p>
                      </div>
                    </div>

                    {/* Step 5: Billing & Checkout */}
                    <div className="flex items-start gap-3 opacity-60 relative">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-700">Billing & Checkout</p>
                          <span className="text-[10px] text-slate-300">--</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carousel Pagination Dots under Phone matching reference */}
                <div className="flex justify-center items-center gap-1.5 mt-5">
                  <span className="w-5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Quick Access Section */}
        <section id="roles" className="border-t border-emerald-900/60 bg-[#051c14]/90 py-16 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Unified Role Access
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                One System. Built for Every Stakeholder.
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70 mt-2">
                Click any role to test the live pre-seeded accounts instantly on this single host:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient */}
              <Link
                href="/login"
                className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60 hover:bg-white/10 hover:border-emerald-500/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Patient Portal
                </h3>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Book specialist visits, check token position, live ETA countdown.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span>Sign In as Patient</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Receptionist */}
              <Link
                href="/login"
                className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60 hover:bg-white/10 hover:border-blue-500/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                  Receptionist Desk
                </h3>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Multi-doctor queue board, walk-in registration, emergency triage.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-400">
                  <span>Sign In as Reception</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Doctor */}
              <Link
                href="/login"
                className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60 hover:bg-white/10 hover:border-teal-500/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                  Doctor Workstation
                </h3>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Running consultation timer, call next, clinical notes & history.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-teal-400">
                  <span>Sign In as Doctor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Admin */}
              <Link
                href="/login"
                className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60 hover:bg-white/10 hover:border-amber-500/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Admin Command Center
                </h3>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Real-time footfall KPIs, doctor roster, staff accounts, audit logs.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <span>Sign In as Admin</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-emerald-900/60 bg-[#07241a] py-16 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Engineered for High-Throughput Hospital OPDs
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70 mt-2">
                Eliminate overcrowding, reduce patient anxiety, and maximize doctor consultation time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-emerald-800/60">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Dynamic Anti-Starvation Queue</h3>
                <p className="text-xs text-emerald-200/70 leading-relaxed">
                  Pure mathematical scoring prioritizing emergency triage, senior citizens, and lab re-entries with +3 dynamic points every 5 minutes to prevent starvation.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-emerald-800/60">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Real-Time Socket Synchronization</h3>
                <p className="text-xs text-emerald-200/70 leading-relaxed">
                  Doctor calling, room shifts, and token progressions are broadcast over Socket.IO directly to patients' phones and waiting area TV monitors in milliseconds.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-emerald-800/60">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Digital Prescription & Checkout</h3>
                <p className="text-xs text-emerald-200/70 leading-relaxed">
                  End consultations with ICD-coded diagnoses, medication prescriptions, follow-up scheduling, and instant billing generation for smooth pharmacy transitions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t border-emerald-900/60 bg-[#051c14]/90 py-16 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Pricing Plans
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Flexible Plans for Clinics to Multispecialty Hospitals
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70 mt-2">
                Transparent monthly tiers with zero hidden setup costs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-emerald-800/60 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Starter Clinic</h3>
                  <p className="text-xs text-emerald-200/60 mt-1">For single-doctor & small OPD clinics</p>
                  <div className="my-5">
                    <span className="text-3xl font-black text-white">₹4,999</span>
                    <span className="text-xs text-emerald-200/60"> /month</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-emerald-100/80">
                    <li className="flex items-center gap-2">✓ Up to 3 Doctors</li>
                    <li className="flex items-center gap-2">✓ Digital Queue & Tokens</li>
                    <li className="flex items-center gap-2">✓ Patient Web Tracking</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-white border border-white/20 transition"
                >
                  Get Started
                </Link>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-900/40 border-2 border-emerald-500/80 flex flex-col justify-between relative shadow-xl shadow-emerald-950/60">
                <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-900 font-black text-[10px] uppercase px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">Hospital Core</h3>
                  <p className="text-xs text-emerald-200/60 mt-1">For multispecialty & district hospitals</p>
                  <div className="my-5">
                    <span className="text-3xl font-black text-white">₹19,999</span>
                    <span className="text-xs text-emerald-200/60"> /month</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-emerald-100/80">
                    <li className="flex items-center gap-2">✓ Up to 25 Doctors & 8 Departments</li>
                    <li className="flex items-center gap-2">✓ Multi-Doctor Reception Board</li>
                    <li className="flex items-center gap-2">✓ Waiting Area TV Live Display</li>
                    <li className="flex items-center gap-2">✓ ABDM & Ayushman Bharat Integration</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="mt-6 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-center text-xs font-black text-slate-950 transition shadow-lg shadow-emerald-500/30"
                >
                  Start 15-Day Free Trial
                </Link>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-emerald-800/60 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Enterprise Network</h3>
                  <p className="text-xs text-emerald-200/60 mt-1">For hospital chains & government bodies</p>
                  <div className="my-5">
                    <span className="text-3xl font-black text-white">Custom</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-emerald-100/80">
                    <li className="flex items-center gap-2">✓ Unlimited Doctors & Campuses</li>
                    <li className="flex items-center gap-2">✓ Dedicated On-Premises or Cloud VPC</li>
                    <li className="flex items-center gap-2">✓ 99.99% SLA & 24/7 Dedicated Support</li>
                    <li className="flex items-center gap-2">✓ Custom HIS/EMR Bi-directional Sync</li>
                  </ul>
                </div>
                <Link
                  href="/login"
                  className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-white border border-white/20 transition"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="border-t border-emerald-900/60 bg-[#07241a] py-16 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Compliance & Trust
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Zero Compromise Healthcare Security
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70 mt-2">
                Designed from ground up with medical data isolation and strict regulatory compliance.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">ABDM / Ayushman Bharat</h4>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Fully compliant with Ayushman Bharat Digital Mission M1, M2, and M3 standards.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60">
                <Lock className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Multi-Tenant Isolation</h4>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Every SQL query is scoped by hospital ID to guarantee zero data leakage across healthcare providers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60">
                <FileText className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Immutable Audit Trail</h4>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Every doctor call, triage override, and administrative update is logged in an append-only audit ledger.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-emerald-800/60">
                <TrendingUp className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">99.99% High Availability</h4>
                <p className="text-xs text-emerald-200/60 mt-1">
                  Stateless microservices backed by Postgres replication ensuring non-stop OPD operations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-900/60 py-8 px-6 text-center text-xs text-emerald-300/50">
        <p>© 2026 SuvidhaaQ Healthcare Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
