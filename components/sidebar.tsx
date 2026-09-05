"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";
import {
  AppWindow,
  Gamepad2,
  LayoutGrid,
  Search,
  Sparkles,
  Wrench,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { name: "Apps", href: "/apps", icon: AppWindow },
  { name: "游戏", href: "/games", icon: Gamepad2 },
  { name: "WEB", href: "/web", icon: Globe },
];

const CATEGORIES_NAV = [
  { name: "全部", href: "/category/all", id: "all", icon: LayoutGrid },
  { name: "工具", href: "/category/tools", id: "tools", icon: Wrench },
  { name: "AI", href: "/category/ai", id: "ai", icon: Sparkles },
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
    <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-background border-r border-border flex flex-col select-none z-30 self-start transition-colors duration-200">
      {/* Top Section */}
      <div className="p-4 space-y-4 overflow-y-auto h-full">
        {/* Header Branding Dropdown with Logo */}
        <Logo variant="sidebar" href="/" />

        {/* Search Input with Lucide Search Icon */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索"
            className="w-full pl-8 pr-3 py-1.5 bg-card border border-input rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
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
                    ? "bg-surface-active text-foreground font-semibold"
                    : "text-foreground hover:bg-secondary-hover/70"
                )}
              >
                <Icon className="w-4 h-4 text-foreground" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Fixed Categories Navigation: Only 工具, WEB, AI (No manual add) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-1 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3 text-foreground" />
              类别 (固定)
            </span>
          </div>

          <nav className="space-y-0.5">
            {CATEGORIES_NAV.map((cat) => {
              const Icon = cat.icon;
              const isActive =
                pathname === cat.href ||
                (cat.id !== "all" &&
                  (pathname === `/category/${cat.id}` ||
                    pathname === `/category/${encodeURIComponent(cat.name)}`));
              return (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors",
                    isActive
                      ? "bg-surface-active text-foreground font-semibold"
                      : "text-foreground hover:bg-secondary-hover/70"
                  )}
                >
                  <Icon className="w-4 h-4 text-foreground" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
