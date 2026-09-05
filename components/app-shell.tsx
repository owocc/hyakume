"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import type React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoSidebar =
    pathname === "/" ||
    pathname === "/recommend" ||
    pathname.startsWith("/recommend/");

  if (isNoSidebar) {
    return (
      <main className="min-h-screen w-full bg-white flex flex-col overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-white">
        {children}
      </main>
    </div>
  );
}
