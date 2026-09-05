"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  const pathname = usePathname();

  const navLinks = [
    { label: "首页", href: "/" },
    { label: "Today", href: "/today" },
    { label: "全部应用", href: "/category/all" },
    { label: "推荐收录", href: "/recommend" },
  ];

  return (
    <header className="w-full bg-background/90 backdrop-blur-md border-b border-border/70 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo on Left */}
        <Logo variant="header" href="/" size="sm" />

        {/* Navigation Links in Center */}
        <nav className="flex items-center gap-6 sm:gap-8">
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Clean empty slot (no login and no signup as requested) */}
        <div className="hidden sm:flex items-center gap-2 w-24 justify-end" aria-hidden="true" />
      </div>
    </header>
  );
}
