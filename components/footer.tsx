"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-surface-card border-t border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-16 py-10 sm:py-16 flex flex-col justify-between min-h-[340px]">
        {/* Main Content: Left Brand & Reserved Illustration space, Right Navigation Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-16">
          {/* Left: Brand Identity & Blank space reserved for illustration */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <Logo variant="footer" href="/" size="md" />

            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t("subTagline")}
            </p>

            {/* Blank placeholder area reserved for future decorative illustration/artwork */}
            <div className="hidden sm:block min-h-[120px] w-full" aria-hidden="true" />
          </div>

          {/* Right: 3 Navigation Columns matching reference layout */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
            {/* Column 1 */}
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                {t("discover")}
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/apps" className="hover:text-primary transition-colors">
                    {t("appsFeatured")}
                  </Link>
                </li>
                <li>
                  <Link href="/category/all" className="hover:text-primary transition-colors">
                    {t("allApps")}
                  </Link>
                </li>
                <li>
                  <Link href="/games" className="hover:text-primary transition-colors">
                    {t("games")}
                  </Link>
                </li>
                <li>
                  <Link href="/web" className="hover:text-primary transition-colors">
                    {t("web")}
                  </Link>
                </li>
                <li>
                  <Link href="/category/tools" className="hover:text-primary transition-colors">
                    {t("tools")}
                  </Link>
                </li>
                <li>
                  <Link href="/category/ai" className="hover:text-primary transition-colors">
                    {t("ai")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                {t("services")}
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/recommend" className="hover:text-primary font-semibold transition-colors">
                    {t("submitApp")}
                  </Link>
                </li>
                <li>
                  <Link href="/recommend" className="hover:text-primary transition-colors">
                    {t("snapshotPipeline")}
                  </Link>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("guidelines")}
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("developerCollab")}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                {t("aboutPlatform")}
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("aboutUs")}
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("terms")}
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("privacy")}
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    {t("contact")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright on left, Theme & Language on right */}
        <div className="border-t border-border pt-6 sm:pt-8 mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <p>{t("copyright")}</p>

          {/* Right side: Language Switcher & Theme Switcher */}
          <div className="flex items-center gap-3 justify-end">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
