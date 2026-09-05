"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { useSession, signOut } from "@/lib/auth-client";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("header");

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
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 sm:h-18 flex items-center justify-between">
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
        <div className="flex items-center gap-3 justify-end">
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
        </div>
      </div>
    </header>
  );
}
