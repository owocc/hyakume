import React from "react";
import { Skeleton } from "@/components/skeleton";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 3 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-5 rounded-3xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Section 1: Recent Articles Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Recommended Apps Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs flex items-center gap-3.5"
            >
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-2.5 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArticlesTabSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="bg-white dark:bg-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col overflow-hidden"
        >
          {/* Top Banner Skeleton */}
          <div className="h-36 w-full bg-neutral-100 dark:bg-neutral-800/60 p-3 relative">
            <Skeleton className="h-5 w-16 rounded-full absolute top-3 right-3" />
          </div>

          {/* Card Body */}
          <div className="p-5 flex flex-col flex-1 space-y-3">
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
            </div>

            <div className="mt-auto pt-4 flex items-center gap-2">
              <Skeleton className="flex-1 h-9 rounded-xl" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppsTabSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Scope Switcher Skeleton */}
      <div className="p-2 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-3.5 w-24 rounded" />
      </div>

      {/* Grid of App Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="bg-white dark:bg-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col overflow-hidden"
          >
            {/* Banner */}
            <div className="h-36 w-full bg-neutral-100 dark:bg-neutral-800/60 p-3 relative">
              <Skeleton className="h-5 w-14 rounded-full absolute top-3 right-3" />
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1 relative space-y-3">
              <div className="-mt-10 mb-1">
                <Skeleton className="w-11 h-11 rounded-full border-2 border-white dark:border-card" />
              </div>

              <Skeleton className="h-5 w-3/5 rounded-md" />
              <Skeleton className="h-3 w-28 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>

              <div className="mt-auto pt-3 space-y-2">
                <Skeleton className="w-full h-8 rounded-xl" />
                <Skeleton className="w-full h-6 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-background text-foreground flex flex-col antialiased">
      {/* Mobile Top Header Skeleton */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-card border-b border-border/80 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
        <Skeleton className="w-20 h-7 rounded-full" />
      </div>

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto">
        {/* Left Sidebar Skeleton */}
        <aside className="hidden md:flex w-64 min-w-[16rem] sticky top-0 h-screen bg-white dark:bg-card border-r border-neutral-200/70 dark:border-neutral-800 flex-col justify-between p-5">
          <div className="space-y-6">
            {/* User Profile */}
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>

            {/* Nav Menu */}
            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800 space-y-2">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-8">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-36 rounded-xl" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-18 rounded-xl" />
              <Skeleton className="h-8 w-36 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>

          {/* Rule Banner Skeleton */}
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/50 dark:bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>

          {/* Overview Body */}
          <DashboardOverviewSkeleton />
        </main>
      </div>

      {/* Footer Skeleton Placeholder */}
      <div className="w-full bg-surface-card border-t border-border p-10 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
      </div>
    </div>
  );
}
