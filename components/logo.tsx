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
 * Pixel Mosaic Mark: 3x3 digital grid iconic mark
 */
export function PixelMark({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-6 h-6 gap-[1.5px] p-[1.5px]",
    md: "w-7 h-7 sm:w-8 sm:h-8 gap-[2px] p-[2px]",
    lg: "w-9 h-9 sm:w-10 sm:h-10 gap-[2.5px] p-[2.5px]",
  }[size];

  return (
    <div className={`grid grid-cols-3 ${sizeClasses} select-none ${className}`}>
      {/* Row 1 */}
      <div className="w-full h-full bg-neutral-400/90 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-900 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-200/80 rounded-[1px]" />
      {/* Row 2 */}
      <div className="w-full h-full bg-neutral-800 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-500 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-300 rounded-[1px]" />
      {/* Row 3 */}
      <div className="w-full h-full bg-neutral-300 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-700 rounded-[1px]" />
      <div className="w-full h-full bg-neutral-100 rounded-[1px]" />
    </div>
  );
}

/**
 * Brand App Icon Mark: Signature rounded app badge with Iris/Mosaic eye theme
 */
export function AppIconMark({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center select-none transition-transform group-hover:scale-105 ${className}`}
    >
      <PixelMark size={size} />
    </div>
  );
}

export function Logo({
  variant = "header",
  size = "md",
  text = SITE_CONFIG.name,
  subtitle = SITE_CONFIG.poweredBy,
  href,
  className = "",
}: LogoProps) {
  // 1. Hero centered vertical variant
  if (variant === "hero") {
    const content = (
      <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
        <PixelMark size={size} />
        <span className="text-[11px] font-medium text-neutral-400 tracking-wide">
          {subtitle}
        </span>
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
