"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useSession, signOut } from "@/lib/auth-client";
export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { label: "首页", href: "/" },
    { label: "Apps", href: "/apps" },
    { label: "游戏", href: "/games" },
    { label: "WEB", href: "/web" },
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

        {/* Right side: User Session / Log In Button */}
        <div className="flex items-center gap-3 justify-end">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium hidden sm:inline max-w-[120px] truncate">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs px-3 py-1 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-600 font-medium transition cursor-pointer"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-sm"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
