import type React from "react";
import { Sidebar } from "@/components/sidebar";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-white">{children}</main>
    </div>
  );
}
