"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CalendarView from "@/components/CalendarView";
import MapView from "@/components/MapView";
import SnsView from "@/components/SnsView";
import { useOshiProfile } from "@/hooks/useOshiProfile";
import { toOshiSearchProfile } from "@/lib/oshi-profile";

export type OshiSection = "calendar" | "map" | "social";

const navigation: { id: OshiSection; label: string; href: string }[] = [
  { id: "calendar", label: "カレンダー", href: "/calendar" },
  { id: "map", label: "マップ", href: "/map" },
  { id: "social", label: "SNS", href: "/social" },
];

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
      <header className="border-b px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/calendar" className="text-lg font-bold">推しごとマップ</Link>
          <Link href="/onboarding" className="text-sm underline underline-offset-2">
            {profile.name} を編集
          </Link>
        </div>
        <nav aria-label="メインナビゲーション" className="mt-3 flex gap-2">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={section === item.id ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm ${
                section === item.id
                  ? "bg-[#FF2D78] font-semibold text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <section className="min-h-[calc(100dvh-112px)] flex-1">
        {section === "calendar" && <CalendarView oshi={oshi} />}
        {section === "map" && <MapView oshi={oshi} />}
        {section === "social" && <SnsView oshi={oshi} />}
      </section>
    </main>
  );
}
