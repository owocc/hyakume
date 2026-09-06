import { notFound } from "next/navigation";
import { getAppById, getReviews, getAllApps, extractDomain } from "@/lib/db";
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

  const [reviews, allApps] = await Promise.all([
    getReviews(id),
    getAllApps(),
  ]);
  const targetDomain = extractDomain(app.url || app.id).cleanDomain;
  const otherApps = allApps.filter((a) => {
    if (a.id === app.id) return false;
    const aDomain = extractDomain(a.url || a.id).cleanDomain;
    const sameDomain = Boolean(targetDomain && aDomain && targetDomain === aDomain);
    const sameDevId = Boolean(
      app.developer_id && a.developer_id && app.developer_id === a.developer_id
    );
    return sameDomain || sameDevId;
  });
  return (
    <div className="w-full min-h-screen">
      <AppDetailClient
        app={app}
        initialReviews={reviews}
        otherApps={otherApps}
      />
    </div>
  );
}
