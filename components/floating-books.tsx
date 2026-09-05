import React from "react";

export function FloatingBooks() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* 1. Top-Left: Grey "The Creative Act" (Rick Rubin) */}
      <div
        style={{ transform: "rotate(-16deg) translateY(-25%) translateX(-15%)" }}
        className="absolute -top-12 -left-10 w-[190px] sm:w-[220px] md:w-[250px] h-[250px] sm:h-[280px] md:h-[320px] rounded-2xl bg-[#E3E2DC] border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-5 flex flex-col justify-between"
      >
        <div className="text-right font-serif text-[#1D1D1F] space-y-0.5 text-xs">
          <p>The</p>
          <p className="font-semibold">Creative</p>
          <p className="font-semibold">Act:</p>
          <p className="italic">A Way</p>
          <p className="italic">of Being</p>
          <p className="text-[9px] font-sans font-bold uppercase text-neutral-500 pt-1">Rick Rubin</p>
        </div>
        <div className="flex justify-center pb-2">
          <div className="w-20 h-20 rounded-full border-[3px] border-[#1D1D1F] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#1D1D1F]" />
          </div>
        </div>
      </div>

      {/* 2. Top-Right: Vibrant Lime/Green "OFF / NIKE" / Virgil Abloh */}
      <div
        style={{ transform: "rotate(14deg) translateY(-25%) translateX(15%)" }}
        className="absolute -top-12 -right-10 w-[190px] sm:w-[220px] md:w-[250px] h-[250px] sm:h-[280px] md:h-[320px] rounded-2xl bg-[#2FD658] border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-6 flex flex-col justify-between text-black"
      >
        <div className="space-y-1">
          <div className="w-10 h-3 bg-black rounded-xs flex items-center justify-center">
            <span className="text-[7px] text-white font-mono">NIKE</span>
          </div>
          <h4 className="text-3xl font-black tracking-tight leading-none pt-2">OFF</h4>
        </div>
        <p className="text-[9px] font-bold font-mono tracking-widest text-black/70">TASCHEN</p>
      </div>

      {/* 3. Mid-Left: Bold Black "ID" Monograph */}
      <div
        style={{ transform: "rotate(-12deg) translateX(-35%)" }}
        className="absolute top-1/2 -translate-y-1/2 -left-12 w-[180px] sm:w-[210px] md:w-[240px] h-[240px] sm:h-[280px] md:h-[310px] rounded-2xl bg-[#18181A] border border-black/5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] p-5 sm:p-6 flex flex-col justify-between text-white"
      >
        <span className="text-[10px] font-mono text-neutral-400">01</span>
        <h3 className="text-7xl sm:text-8xl font-black tracking-tighter leading-none my-auto">ID</h3>
        <div className="border-t border-neutral-800 pt-2 text-[9px] text-neutral-400 font-mono">
          MONOGRAPH
        </div>
      </div>

      {/* 4. Mid-Right: Dark "Principles of Logo Design" with Swan */}
      <div
        style={{ transform: "rotate(11deg) translateX(30%)" }}
        className="absolute top-1/2 -translate-y-1/2 -right-10 w-[180px] sm:w-[210px] md:w-[240px] h-[240px] sm:h-[280px] md:h-[310px] rounded-2xl bg-[#212124] border border-black/5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] p-5 sm:p-6 flex flex-col justify-between text-white"
      >
        <div className="space-y-1">
          <h4 className="text-sm font-bold leading-tight">Principles of Logo Design</h4>
          <p className="text-[9px] text-neutral-400">Practical guide to creating effective signs</p>
        </div>
        {/* Stylized swan icon */}
        <div className="flex justify-center my-auto">
          <svg viewBox="0 0 60 60" className="w-20 h-20 text-white">
            <path
              d="M15 45 C25 45 40 38 45 25 C47 20 45 15 40 18 C36 21 34 26 30 32 C26 38 20 42 15 45 Z"
              fill="white"
            />
            <circle cx="43" cy="18" r="1.5" fill="#FF5500" />
          </svg>
        </div>
        <p className="text-[9px] text-neutral-400 font-mono">BY GEORGE BOKHUA</p>
      </div>

      {/* 5. Bottom-Left: Hot Magenta "Paula Scher: Works" */}
      <div
        style={{ transform: "rotate(16deg) translateY(35%) translateX(-10%)" }}
        className="absolute -bottom-10 -left-6 w-[180px] sm:w-[210px] md:w-[240px] h-[240px] sm:h-[270px] md:h-[300px] rounded-2xl bg-[#E62070] border border-black/5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] p-5 flex flex-col justify-between text-white overflow-hidden"
      >
        <div className="relative z-10">
          <h4 className="text-sm font-bold">Paula Scher: Works</h4>
          <p className="text-[9px] text-white/80 font-mono">UNIT EDITIONS</p>
        </div>
        <div className="absolute -bottom-6 -right-6 w-44 h-44 opacity-85">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {[14, 24, 34, 44, 54, 64, 74].map((r, i) => (
              <path
                key={i}
                d={`M 10,${100 - r} A ${r} ${r} 0 0 1 ${100 - r},10`}
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* 6. Bottom-Center: Clean White "How to" Michael Bierut */}
      <div
        style={{ transform: "rotate(-3deg) translateY(30%)" }}
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[190px] sm:w-[220px] md:w-[250px] h-[250px] sm:h-[280px] md:h-[310px] rounded-2xl bg-white border border-neutral-200 shadow-[0_25px_60px_rgba(0,0,0,0.18)] p-6 flex flex-col justify-between text-black"
      >
        <div>
          <h3 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">
            How
            <br />
            to
          </h3>
          <p className="text-[10px] leading-snug font-normal text-neutral-600 pt-2 max-w-[150px]">
            use graphic design to sell things, make things look better...
          </p>
        </div>
        <div className="border-t border-neutral-200 pt-2 text-[9px] font-bold">MICHAEL BIERUT</div>
      </div>

      {/* 7. Bottom-Right: Bright Yellow "Designing Brand Identity" */}
      <div
        style={{ transform: "rotate(9deg) translateY(35%) translateX(10%)" }}
        className="absolute -bottom-10 -right-6 w-[180px] sm:w-[210px] md:w-[240px] h-[240px] sm:h-[270px] md:h-[300px] rounded-2xl bg-[#FCEB38] border border-black/5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] p-5 flex flex-col justify-between text-neutral-900"
      >
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase leading-tight">
            Designing
            <br />
            Brand
            <br />
            Identity
          </h3>
        </div>
        <div className="flex justify-center opacity-70">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            {[16, 28, 40].map((r, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="#1D1D1F"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            ))}
          </svg>
        </div>
        <div className="text-[10px] font-bold">Alina Wheeler</div>
      </div>
    </div>
  );
}
