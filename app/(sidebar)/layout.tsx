import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <div className="flex flex-col md:flex-row flex-1 w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-background">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
