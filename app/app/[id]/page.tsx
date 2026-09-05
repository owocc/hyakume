import { notFound } from "next/navigation";
import { getAppById, getReviews, getAllApps } from "@/lib/db";
import { AppDetailClient } from "@/components/app-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AppDetailPage({ params }: Props) {
  const { id } = await params;
  const app = await getAppById(id);

  if (!app) {
    notFound();
  }

  const reviews = await getReviews(id);
  const allApps = await getAllApps();
  const otherApps = allApps.filter((a) => a.id !== app.id);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <AppDetailClient
        app={app}
        initialReviews={reviews}
        otherApps={otherApps}
      />
    </div>
  );
}
