"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";
import {
  Calendar,
  Layers,
  Gamepad2,
  LayoutGrid,
  Search,
  Sparkles,
  ChevronDown,
  Wrench,
  Globe,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { name: "Today", href: "/", icon: Calendar },
  { name: "游戏", href: "/category/游戏", icon: Gamepad2 },
  { name: "App", href: "/category/App", icon: Layers },
];

const FIXED_CATEGORIES_NAV = [
  { name: "全部", href: "/category/all", icon: LayoutGrid },
  { name: "工具", href: "/category/工具", icon: Wrench },
  { name: "WEB", href: "/category/WEB", icon: Globe },
  { name: "AI", href: "/category/AI", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-[#F5F5F7]/95 border-r border-[#E5E5EA] flex flex-col justify-between select-none z-30">
      {/* Top Section */}
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Header Branding Dropdown with Lucide Store Icon */}
        <div className="flex items-center justify-between px-2 py-1 text-[#1D1D1F] hover:opacity-80 transition cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
              App Store iPhone 专区
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#86868B]" />
        </div>

        {/* Search Input with Lucide Search Icon */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索"
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D2D2D7] rounded-lg text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition"
          />
        </form>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#E5E5EA] text-[#1D1D1F] font-semibold"
                    : "text-[#1D1D1F] hover:bg-[#EAEAEA]/70"
                )}
              >
                <Icon className="w-4 h-4 text-[#0071E3]" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Fixed Categories Navigation: Only 工具, WEB, AI (No manual add) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-1 text-[11px] font-semibold text-[#86868B] tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3 text-[#0071E3]" />
              类别 (固定)
            </span>
          </div>

          <nav className="space-y-0.5">
            {FIXED_CATEGORIES_NAV.map((cat) => {
              const Icon = cat.icon;
              const isActive =
                pathname === cat.href ||
                (cat.name !== "全部" &&
                  pathname === `/category/${encodeURIComponent(cat.name)}`);
              return (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors",
                    isActive
                      ? "bg-[#E5E5EA] text-[#1D1D1F] font-semibold"
                      : "text-[#1D1D1F] hover:bg-[#EAEAEA]/70"
                  )}
                >
                  <Icon className="w-4 h-4 text-[#0071E3]" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Action: "推荐工具" with Lucide Sparkles Icon */}
      <div className="p-3 border-t border-[#E5E5EA] bg-[#F5F5F7]">
        <Link
          href="/recommend"
          className={cn(
            "group block w-full p-2.5 rounded-xl border transition-all duration-200",
            pathname === "/recommend"
              ? "bg-[#0071E3] text-white border-[#0071E3] shadow-md shadow-[#0071E3]/25"
              : "bg-white hover:bg-blue-50/50 border-[#E5E5EA] text-[#1D1D1F] hover:border-[#0071E3]/40"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                pathname === "/recommend"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-[#0071E3] group-hover:bg-[#0071E3] group-hover:text-white"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs truncate">
                  推荐工具
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    pathname === "/recommend"
                      ? "bg-white/20 text-white"
                      : "bg-[#F2F2F7] text-[#0071E3]"
                  )}
                >
                  AI 收录
                </span>
              </div>
              <p
                className={cn(
                  "text-[10px] truncate",
                  pathname === "/recommend" ? "text-white/80" : "text-[#86868B]"
                )}
              >
                粘贴网址 · AI 一键自动化
              </p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
