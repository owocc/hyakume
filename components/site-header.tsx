"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { useSession, signOut } from "@/lib/auth-client";
import { Menu, X } from "lucide-react";
export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("header");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  const navLinks = [
    { label: t("home"), href: "/" },
    { label: t("apps"), href: "/apps" },
    { label: t("games"), href: "/games" },
    { label: t("web"), href: "/web" },
    { label: t("allApps"), href: "/category/all" },
    { label: t("recommend"), href: "/recommend" },
  ];

  return (
    <header className="w-full bg-background/90 backdrop-blur-md border-b border-border/70 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo on Left */}
        <Logo variant="header" href="/" size="sm" />

        {/* Navigation Links in Center */}
        <nav className="hidden md:flex items-center gap-6 sm:gap-8">
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

        {/* Right side: User Session / Log In Button */}
        {/* Right side: User Session / Log In Button & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium hidden sm:inline max-w-[120px] truncate">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium transition cursor-pointer"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all shadow-sm"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button (< md) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-foreground hover:bg-secondary transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/70 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-surface-active text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
