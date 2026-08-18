import React from 'react'
import { Sparkles } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="relative min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden px-6 text-center font-sans">
      {/* Background Video with low opacity and screen blend mode */}
      <video
        src="/intro-petone.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-20 pointer-events-none z-0"
      />

      {/* Subtle background glow */}
      <div className="absolute top-[30%] left-[25%] w-[250px] h-[250px] rounded-full bg-emerald-950/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[30%] right-[25%] w-[250px] h-[250px] rounded-full bg-teal-950/20 blur-[100px] pointer-events-none z-0" />

      {/* Main Content Container */}
      <main className="relative z-10 max-w-xl flex flex-col items-center">
        {/* Large Logo */}
        <div className="mb-6 animate-fade-in-scale delay-1">
          <img 
            src="/logo-petone.png" 
            alt="PetOne Logo" 
            className="w-40 md:w-48 h-auto object-contain rounded-2xl border border-emerald-500/10 shadow-2xl bg-[#020617]/40 backdrop-blur-sm p-4"
          />
        </div>

        {/* Status Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up delay-2">
          <Sparkles size={10} className="animate-pulse" /> Muy Pronto
        </span>

        {/* Coming Soon Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 animate-fade-in-up delay-3 leading-tight">
          Pronto <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">PetOne</span>
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto leading-relaxed mb-10 animate-fade-in-up delay-4">
          La plataforma definitiva para paseadores profesionales de perros y la tranquilidad de sus clientes. Control de rutas GPS y reportes en tiempo real.
        </p>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 animate-fade-in-up delay-5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span>Preparando el terreno para tu manada</span>
        </div>
      </main>
    </div>
  )
}
