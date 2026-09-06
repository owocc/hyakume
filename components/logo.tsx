"use client";

import React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/config";

export interface LogoProps {
  /**
   * Layout variant:
   * - "hero": Centered vertical layout with pixel mosaic icon + subtitle (used in Landing & Recommend hero)
   * - "header": Horizontal layout with brand mark + title (used in SiteHeader)
   * - "sidebar": Horizontal compact layout for sidebar header (used in Sidebar)
   * - "footer": Horizontal brand mark + bold title (used in Footer)
   * - "icon-only": Just the brand mark
   */
  variant?: "hero" | "header" | "sidebar" | "footer" | "icon-only";
  /** Size multiplier: "sm" | "md" | "lg" */
  size?: "sm" | "md" | "lg";
  /** Custom text override (defaults to SITE_CONFIG.name) */
  text?: string;
  /** Custom subtitle override (defaults to SITE_CONFIG.poweredBy) */
  subtitle?: string;
  /** Whether to wrap in a Next.js <Link href="/"> */
  href?: string;
  className?: string;
}

/**
 * Brand App Icon Mark: Signature rounded app badge using the custom logo
 */
export function AppIconMark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-7 h-7 sm:w-8 sm:h-8 rounded-lg",
    md: "w-8 h-8 sm:w-9 sm:h-9 rounded-xl",
    lg: "w-10 h-10 sm:w-11 sm:h-11 rounded-xl",
    hero: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-md",
  }[size] || "w-8 h-8 sm:w-9 sm:h-9 rounded-xl";

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none overflow-hidden bg-black border border-white/15 shadow-sm transition-transform duration-200 group-hover:scale-105 ${sizeClasses} ${className}`}
    >
      <img
        src="/logo.jpeg"
        alt="Hyakume Logo"
        width={128}
        height={128}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );
}

/**
 * Backward compatible alias for PixelMark
 */
export const PixelMark = AppIconMark;

export function Logo({
  variant = "header",
  size = "md",
  text = SITE_CONFIG.name,
  subtitle = "",
  href,
  className = "",
}: LogoProps) {
  // 1. Hero centered vertical variant
  if (variant === "hero") {
    const content = (
      <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
        <AppIconMark size="hero" />
        {subtitle ? (
          <span className="text-[11px] font-medium text-neutral-400 tracking-wide">
            {subtitle}
          </span>
        ) : null}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block hover:opacity-85 transition-opacity">
          {content}
        </Link>
      );
    }
    return content;
  }

  // 2. Icon only variant
  if (variant === "icon-only") {
    return <AppIconMark size={size} className={className} />;
  }

  // 3. Sidebar header variant
  if (variant === "sidebar") {
    const content = (
      <div className={`flex items-center w-full select-none ${className}`}>
        <div className="flex items-center gap-2.5">
          <AppIconMark size="sm" />
          <span className="font-semibold text-sm tracking-tight text-foreground">
            {text}
          </span>
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="flex items-center w-full px-2 py-1 text-foreground hover:opacity-80 transition cursor-pointer group">
          {content}
        </Link>
      );
    }
    return content;
  }

  // 4. Header & Footer horizontal brand variant
  const textSizes = {
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <AppIconMark size={size} />
      <span className={`font-extrabold tracking-tight text-foreground ${textSizes}`}>
        {text}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center group hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
