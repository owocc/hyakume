"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AppItem } from "@/lib/types";
import { getCardTheme } from "@/lib/utils";

interface Props {
  app: AppItem;
  tag: string;
}

export function HeroFeaturedCard({ app, tag }: Props) {
  // Initialize with DB primary_color if present
  const [isLight, setIsLight] = useState<boolean>(() => {
    return getCardTheme(app.primary_color).isLight;
  });

  // Client-side image sampling fallback: if no primary_color or to verify cover brightness in text area
  useEffect(() => {
    if (app.primary_color) {
      setIsLight(getCardTheme(app.primary_color).isLight);
      return;
    }

    if (!app.cover_url) return;

    // Fast client-side image canvas sampling
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = app.cover_url;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Sample the top-left area where the title and tag text sit
          ctx.drawImage(img, 0, 0, 16, 16);
          const data = ctx.getImageData(0, 0, 16, 16).data;
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            // Ignore transparent pixels
            if (data[i + 3] > 50) {
              rSum += data[i];
              gSum += data[i + 1];
              bSum += data[i + 2];
              count++;
            }
          }
          if (count > 0) {
            const r = rSum / count;
            const g = gSum / count;
            const b = bSum / count;
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            setIsLight(luminance > 140);
          }
        }
      } catch {
        // Fallback gracefully on CORS canvas restriction
      }
    };
  }, [app.cover_url, app.primary_color]);

  // Contrast theme
  const theme = getCardTheme(isLight ? "#ffffff" : "#000000");

  return (
    <Link
      href={`/app/${app.id}`}
      className={`group relative flex-1 min-h-[460px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex flex-col justify-between p-7 pb-24 ${
        isLight ? "bg-[#F5F5F7]" : "bg-neutral-900"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url(${app.cover_url})` }}
      />

      {/* Top text with calculated contrast color */}
      <div className="relative z-10 space-y-1">
        <span
          className="text-xs font-bold uppercase tracking-wider block"
          style={{ color: theme.tagColor }}
        >
          {tag}
        </span>
        <h2
          className="text-2xl lg:text-3xl font-extrabold leading-snug tracking-tight max-w-md"
          style={{ color: theme.textColor }}
        >
          {app.name}：{app.tagline}
        </h2>
      </div>

      {/* Bottom Info Bar: Flush at bottom, full card width with blur, no rounded corners, no top border */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-4 ${theme.barBg}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={app.icon_url}
            alt={app.name}
            className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <h3
              className="font-bold text-sm leading-tight truncate"
              style={{ color: theme.textColor }}
            >
              {app.name}
            </h3>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: theme.subtitleColor }}
            >
              {app.category} • {app.rating}★ ({app.rating_count})
            </p>
          </div>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-sm transition shrink-0 ml-3 ${theme.buttonClass}`}
        >
          查看
        </span>
      </div>
    </Link>
  );
}
