import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "App Store - Web App 精选收录平台",
  description: "发现与探索优秀的现代化 Web App，支持 AI 一键自动化收录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 bg-white overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
