import type React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground transition-colors duration-200">
      {children}
    </div>
  );
}
