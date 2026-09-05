"use client";

import React, { useState } from "react";
import Link from "next/link";

interface BookItem {
  id: string;
  title: string;
  rotation: number;
  translateX: number;
  translateY: number;
  zIndex: number;
  renderCover: () => React.ReactNode;
}

export function BookFan() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const books: BookItem[] = [
    // 1. Black "ID" Typographic Book (leftmost in original photo)
    {
      id: "id-book",
      title: "ID",
      rotation: -22,
      translateX: -310,
      translateY: 85,
      zIndex: 10,
      renderCover: () => (
        <div className="w-full h-full bg-[#18181A] text-white p-6 sm:p-7 flex flex-col justify-between select-none relative overflow-hidden">
          {/* Subtle hardcover spine groove */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[11px] font-mono tracking-widest text-neutral-400">
              01
            </span>
          </div>

          {/* Huge bold white ID typography bleeding off edge */}
          <div className="relative z-10 my-auto -ml-1">
            <h3 className="text-8xl sm:text-9xl font-black tracking-tighter text-white leading-none select-none font-sans">
              ID
            </h3>
          </div>

          <div className="relative z-10 border-t border-neutral-800 pt-3 flex justify-between items-center text-[10px] text-neutral-400 font-mono tracking-wider">
            <span>GRAPHIC DESIGN</span>
            <span>2026</span>
          </div>
        </div>
      ),
    },

    // 2. Rick Rubin: The Creative Act: A Way of Being (warm stone grey)
    {
      id: "creative-act",
      title: "The Creative Act: A Way of Being",
      rotation: -11,
      translateX: -175,
      translateY: 45,
      zIndex: 18,
      renderCover: () => (
        <div className="w-full h-full bg-[#E3E2DC] text-[#1A1A1A] p-5 sm:p-6 flex flex-col justify-between select-none relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />

          {/* Top text block stacked vertically on the right */}
          <div className="text-right space-y-0.5 pt-1 pr-1 font-serif select-none">
            <p className="text-xs sm:text-sm font-medium tracking-wide">The</p>
            <p className="text-xs sm:text-sm font-semibold tracking-wide">Creative</p>
            <p className="text-xs sm:text-sm font-semibold tracking-wide">Act:</p>
            <p className="text-[11px] sm:text-xs italic tracking-wide">A</p>
            <p className="text-xs sm:text-sm font-medium tracking-wide">Way</p>
            <p className="text-[11px] sm:text-xs italic tracking-wide">of</p>
            <p className="text-xs sm:text-sm font-semibold tracking-wide">Being</p>
            <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-neutral-500 pt-1.5">
              Rick Rubin
            </p>
          </div>

          {/* Iconic large black circle arc at bottom */}
          <div className="flex justify-center items-end pb-1 select-none">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[3.5px] border-[#1A1A1A] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#1A1A1A]" />
            </div>
          </div>
        </div>
      ),
    },

    // 3. Designing Brand Identity (vibrant yellow cover with circular pattern)
    {
      id: "brand-identity",
      title: "Designing Brand Identity",
      rotation: -3,
      translateX: -35,
      translateY: 10,
      zIndex: 26,
      renderCover: () => (
        <div className="w-full h-full bg-[#FCEB38] text-neutral-900 p-6 sm:p-7 flex flex-col justify-between select-none relative overflow-hidden">
          {/* Blue cloth spine binding at top-left edge */}
          <div className="absolute top-0 left-0 w-4 h-full bg-[#1E3A8A] shadow-inner" />

          <div className="pl-3 space-y-1 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.05] uppercase">
              Designing
              <br />
              Brand
              <br />
              Identity
            </h3>
            <p className="text-[11px] font-medium text-neutral-800 tracking-normal pt-1">
              an essential guide for the whole branding team
            </p>
          </div>

          {/* Concentric circular lines pattern */}
          <div className="pl-3 my-auto flex items-center justify-center relative z-10 opacity-80">
            <svg viewBox="0 0 140 140" className="w-36 h-36">
              {[14, 24, 34, 44, 54, 64].map((radius, idx) => (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#1D1D1F"
                  strokeWidth="1.2"
                  strokeDasharray={idx % 2 === 0 ? "4 3" : "2 3"}
                />
              ))}
            </svg>
          </div>

          <div className="pl-3 pt-1 text-[11px] font-bold tracking-wider uppercase text-neutral-900 relative z-10">
            Alina Wheeler
          </div>
        </div>
      ),
    },

    // 4. "How to..." Michael Bierut (clean white, huge bold typography)
    {
      id: "how-to",
      title: "How to",
      rotation: 4,
      translateX: 110,
      translateY: 25,
      zIndex: 22,
      renderCover: () => (
        <div className="w-full h-full bg-[#FFFFFF] text-black p-6 sm:p-7 flex flex-col justify-between select-none relative overflow-hidden border-t border-neutral-100">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <h3 className="text-6xl sm:text-7xl font-black tracking-tighter leading-[0.9] select-none">
              How
              <br />
              to
            </h3>
            <p className="text-[11px] leading-snug font-normal text-neutral-700 max-w-[170px] pt-3">
              use graphic design to sell things, explain things, make things look better, make people laugh, make people cry, and (every once in a while) change the world
            </p>
          </div>

          <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-[10px] font-bold text-neutral-900 relative z-10">
            <span>MICHAEL BIERUT</span>
            <span className="text-[9px] font-mono text-neutral-500">PENTAGRAM</span>
          </div>
        </div>
      ),
    },

    // 5. Virgil Abloh / Design Book (Lime/Neon Green - background peeking)
    {
      id: "virgil",
      title: "Figures of Speech",
      rotation: 9,
      translateX: 225,
      translateY: 20,
      zIndex: 14,
      renderCover: () => (
        <div className="w-full h-full bg-[#2FD658] text-neutral-950 p-6 sm:p-7 flex flex-col justify-between select-none relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-block bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded-xs tracking-wider">
              &quot;CATALOG&quot;
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
              WHAT I DO
              <br />
              TO MYSELF
            </h4>
          </div>

          <div className="my-auto font-mono text-[10px] space-y-1 text-neutral-800 border-l-2 border-black/40 pl-2.5">
            <p>2026 EDITION</p>
            <p>DESIGN ARCHIVE</p>
            <p>CONTEMPORARY</p>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-black">
            VIRGIL ABLOH™
          </p>
        </div>
      ),
    },

    // 6. Paula Scher: Works (vibrant pink/magenta with radiating arch lines)
    {
      id: "paula-scher",
      title: "Paula Scher: Works",
      rotation: 18,
      translateX: 330,
      translateY: 80,
      zIndex: 17,
      renderCover: () => (
        <div className="w-full h-full bg-[#E92B78] text-white p-6 sm:p-7 flex flex-col justify-between select-none relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <h4 className="text-lg sm:text-xl font-bold tracking-tight">
              Paula Scher: Works
            </h4>
            <p className="text-[10px] text-white/80 font-mono tracking-widest uppercase">
              Unit Editions
            </p>
          </div>

          {/* Radiating concentric rainbow arch pattern */}
          <div className="absolute -bottom-6 -right-6 w-52 h-52 pointer-events-none opacity-90">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[15, 24, 33, 42, 51, 60, 69, 78].map((radius, idx) => (
                <path
                  key={idx}
                  d={`M 8,${100 - radius} A ${radius} ${radius} 0 0 1 ${100 - radius},8`}
                  fill="none"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>

          <div className="relative z-10 text-[10px] font-mono text-white/90">
            MONOGRAPH
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full flex justify-center items-end select-none overflow-hidden pt-2 pb-0">
      {/* Outer scale container ensures responsive adaptation */}
      <div className="relative w-full max-w-5xl h-[280px] sm:h-[320px] md:h-[360px] lg:h-[380px] flex justify-center items-end scale-[0.62] xs:scale-[0.72] sm:scale-[0.84] md:scale-[0.94] lg:scale-100 origin-bottom overflow-hidden">
        {books.map((book) => {
          const isHovered = hoveredId === book.id;
          const isAnyHovered = hoveredId !== null;

          return (
            <Link
              key={book.id}
              href="/apps"
              onMouseEnter={() => setHoveredId(book.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                transform: `translateX(${book.translateX}px) translateY(${
                  isHovered ? book.translateY - 36 : book.translateY
                }px) rotate(${isHovered ? book.rotation * 0.4 : book.rotation}deg) scale(${
                  isHovered ? 1.08 : 1
                })`,
                zIndex: isHovered ? 50 : book.zIndex,
                filter:
                  isAnyHovered && !isHovered
                    ? "brightness(0.92) contrast(0.98)"
                    : "none",
              }}
              className="absolute bottom-[-30px] sm:bottom-[-25px] md:bottom-[-20px] w-[180px] sm:w-[210px] md:w-[235px] h-[250px] sm:h-[290px] md:h-[325px] rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-300 ease-out will-change-transform shadow-[0_20px_45px_-10px_rgba(0,0,0,0.26),0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_32px_65px_-12px_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.12)] overflow-hidden border border-black/5"
            >
              {/* Paper page edge highlight for realism */}
              <div className="absolute right-0 top-1 bottom-1 w-[3px] bg-gradient-to-l from-white/90 via-neutral-200 to-transparent pointer-events-none z-30" />
              {/* Top bevel highlight */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/40 pointer-events-none z-30" />

              {/* Book cover artwork */}
              {book.renderCover()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
