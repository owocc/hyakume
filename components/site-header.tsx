"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { useSession, signOut } from "@/lib/auth-client";
import { Menu, X, Plus } from "lucide-react";
export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("header");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Track scroll state to trigger isolated background styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t("home"), href: "/" },
    { label: t("apps"), href: "/apps" },
    { label: t("games"), href: "/games" },
    { label: t("web"), href: "/web" },
    { label: t("allApps"), href: "/category/all" },
    { label: t("recommend"), href: "/recommend" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none transition-all duration-300">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        {/* 
          ========================================================================
          LEFT CLUSTER (Left Island):
          - Brand Logo + Nav Links
          - Initial state: completely transparent, no background
          - Scrolled state: isolated frosted glass capsule (单独背景)
          ========================================================================
        */}
        <div
          className={`
            pointer-events-auto flex items-center gap-3 sm:gap-6 rounded-full transition-all duration-300 ease-out
            ${
              scrolled
                ? "bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/80 shadow-sm px-4 py-2"
                : "bg-transparent border border-transparent px-2 py-1.5"
            }
          `}
        >
          {/* Logo on Left */}
          <Logo variant="header" href="/" size="sm" />

          {/* Nav Links in Center (Desktop >= md) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 border-l border-border/50 pl-4 lg:pl-6 my-0.5">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-medium transition-colors relative py-0.5 ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 
          ========================================================================
          RIGHT CLUSTER (Right Island):
          - User session / Login button / Dashboard entry / Mobile hamburger
          - Initial state: completely transparent, no background
          - Scrolled state: isolated frosted glass capsule (单独背景)
          ========================================================================
        */}
        <div className="relative pointer-events-auto">
          <div
            className={`
              flex items-center gap-2 sm:gap-2.5 rounded-full transition-all duration-300 ease-out
              ${
                scrolled
                  ? "bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/80 shadow-sm px-3.5 sm:px-4 py-1.5 sm:py-2"
                  : "bg-transparent border border-transparent px-2 py-1.5"
              }
            `}
          >
            {session?.user ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link
                  href="/dashboard"
                  className="text-xs px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shadow-2xs flex items-center gap-1.5 active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>我的发布</span>
                </Link>

                <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium hidden sm:inline max-w-[120px] truncate">
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
              <div className="flex items-center gap-2">
                <Link
                  href="/recommend"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>推荐收录</span>
                </Link>

                <Link
                  href="/login"
                  className="text-xs font-semibold px-4 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all shadow-sm"
                >
                  {t("login")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button (< md) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-foreground hover:bg-secondary transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Floating Mobile Dropdown Menu attached to the Right Island */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full right-0 mt-2 w-56 rounded-2xl bg-background/95 dark:bg-card/95 backdrop-blur-xl border border-border shadow-xl p-3 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
              <nav className="flex flex-col space-y-0.5">
                {navLinks.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-surface-active text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {session?.user && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2 mt-1 border-t border-border pt-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>我的发布 (Dashboard)</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
