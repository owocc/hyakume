import Link from "next/link";
import { BookFan } from "@/components/book-fan";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { SITE_CONFIG } from "@/lib/config";

export const metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
};


function WebApp3DIcon() {
  return (
    <span className="inline-block transform rotate-12 hover:rotate-0 transition-transform duration-300 align-middle -translate-y-0.5 mx-1.5">
      <svg
        width="44"
        height="44"
        viewBox="0 0 48 48"
        fill="none"
        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 inline-block drop-shadow-md"
      >
        {/* Shadow / depth underlay */}
        <rect x="10" y="8" width="30" height="30" rx="9" fill="#000000" opacity="0.35" />
        {/* Main App Icon body with modern deep black gradient */}
        <rect x="8" y="6" width="32" height="32" rx="9" fill="url(#appIconGrad)" />
        {/* Bevel highlight */}
        <rect
          x="9"
          y="7"
          width="30"
          height="15"
          rx="8"
          fill="url(#topGlow)"
          opacity="0.35"
        />
        {/* Browser / App Window wireframe symbol */}
        <rect x="14" y="13" width="20" height="18" rx="3" fill="none" stroke="white" strokeWidth="2" />
        <line x1="14" y1="18" x2="34" y2="18" stroke="white" strokeWidth="1.5" />
        <circle cx="17.5" cy="15.5" r="1" fill="white" />
        <circle cx="21" cy="15.5" r="1" fill="white" opacity="0.7" />
        <circle cx="24.5" cy="15.5" r="1" fill="white" opacity="0.7" />
        {/* Mini sparkles star */}
        <path
          d="M27 23L28 25L30 26L28 27L27 29L26 27L24 26L26 25L27 23Z"
          fill="#FDE047"
        />
        <defs>
          <linearGradient id="appIconGrad" x1="8" y1="6" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#27272A" />
            <stop offset="0.5" stopColor="#18181B" />
            <stop offset="1" stopColor="#09090B" />
          </linearGradient>
          <linearGradient id="topGlow" x1="24" y1="7" x2="24" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="w-full bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      {/* 
        Hero Section: Strict 100dvh height viewport.
        overflow-hidden prevents hero scrolling and content clipping/spillover.
      */}
      <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative flex-none">
        {/* Top Section: Centered Logo & Branding */}
        <header className="pt-6 sm:pt-8 md:pt-9 px-6 flex justify-center items-center z-10 flex-none">
          <Logo variant="hero" href="/" />
        </header>

        {/* Hero Section: Centered Headline, Subtitle, Dual CTAs */}
        <section className="px-6 py-2 text-center max-w-3xl mx-auto z-10 flex flex-col items-center flex-none">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold tracking-tight text-foreground leading-[1.12]">
            One Stop Digital
            <br />
            Directory <WebApp3DIcon /> for Web Apps.
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-normal mt-2.5 sm:mt-3.5 max-w-lg mx-auto leading-relaxed">
            现代化 Web App 精选收录平台。发现前沿在线工具，或一键提交推荐与产品投放。
          </p>

          {/* Dual Actions: 推荐 / 投放 on left, View Apps on right */}
          <div className="mt-4 sm:mt-5 flex items-center justify-center gap-3">
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card text-foreground text-xs sm:text-sm font-medium border border-border hover:bg-surface active:scale-[0.98] transition-all duration-200 shadow-2xs hover:shadow-xs"
            >
              <span>推荐 / 投放</span>
            </Link>

            <Link
              href="/apps"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View Apps
            </Link>
          </div>
        </section>

        {/* Bottom Section: Fan-out of Books / Product Monographs */}
        <section className="w-full relative mt-auto z-0 overflow-hidden flex justify-center items-end flex-none">
          <BookFan />
        </section>
      </div>

      {/* 
        Separate Footer Section: Located at bottom of landing page.
        Revealed upon scrolling down from the 100dvh hero viewport.
      */}
      <Footer />
    </div>
  );
}
