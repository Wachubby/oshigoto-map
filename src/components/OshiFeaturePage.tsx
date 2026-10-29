"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Calendar from "@/components/Calendar";
import MapView from "@/components/MapView";
import SnsView from "@/components/SnsView";
import { useOshiProfile } from "@/hooks/useOshiProfile";
import { toOshiSearchProfile } from "@/lib/oshi-profile";

export type OshiSection = "calendar" | "map" | "social";

export default function OshiFeaturePage({
  section,
}: {
  section: OshiSection;
}) {
  const router = useRouter();
  const { profile, ready, error } = useOshiProfile();

  useEffect(() => {
    if (ready && !profile && !error) router.replace("/onboarding");
  }, [error, profile, ready, router]);

  if (!ready) {
    return <p role="status" className="p-6 text-sm text-gray-500">推し情報を読み込んでいます…</p>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <Link href="/onboarding" className="mt-4 inline-block underline">推し情報を登録し直す</Link>
      </main>
    );
  }

  if (!profile) {
    return <p role="status" className="p-6 text-sm text-gray-500">推しの登録画面へ移動しています…</p>;
  }

  const oshi = toOshiSearchProfile(profile);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white">
      <AppHeader
        oshiName={profile.name}
        activeSection={section}
        showSectionTabs
      />
      <section className="min-h-[calc(100dvh-112px)] flex-1">
        {section === "calendar" && <Calendar />}
        {section === "map" && <MapView oshi={oshi} />}
        {section === "social" && <SnsView oshi={oshi} />}
      </section>
    </main>
  );
}
