"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Globe, Check, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

const LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "zh-cn", label: "Chinese (Simplified)", nativeName: "简体中文" },
] as const;

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  let currentLocale = "en";
  try {
    currentLocale = useLocale();
  } catch {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(
        /(?:^|;\s*)(?:NEXT_LOCALE|locale)=([^;]+)/
      );
      if (match) currentLocale = match[1];
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    setIsOpen(false);

    startTransition(() => {
      router.refresh();
      window.location.reload();
    });
  };

  const currentLang =
    LANGUAGES.find((l) => l.code === currentLocale) || LANGUAGES[0];

  if (!mounted) {
    // Avoid hydration mismatch before client mounting, matching ThemeToggle skeleton height exactly
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-surface/70 w-[100px] h-[32px]",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* Dropdown trigger button matching ThemeToggle height (32px) and style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="选择语言 (Select Language)"
        disabled={isPending}
        className={cn(
          "h-[32px] px-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 text-muted-foreground hover:text-foreground text-xs font-medium shadow-2xs transition-all duration-150 cursor-pointer select-none",
          isOpen && "border-primary/50 text-foreground bg-surface"
        )}
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="leading-none">{currentLang.nativeName}</span>
        <ChevronUp
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-150 shrink-0",
            isOpen ? "rotate-0 text-foreground" : "rotate-180"
          )}
        />
      </button>

      {/* Upward popup dropdown menu for footer */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="语言列表"
          className="absolute right-0 bottom-full mb-2 w-36 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-lg p-1 z-50 animate-in fade-in zoom-in-95"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLocale;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => switchLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer",
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/80"
                )}
              >
                <span>{lang.nativeName}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
