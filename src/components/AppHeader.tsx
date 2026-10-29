"use client";

import { useState } from "react";
import Link from "next/link";

type AppSection = "calendar" | "map" | "social";

const sections: { id: AppSection; label: string; href: string }[] = [
  { id: "calendar", label: "カレンダー", href: "/calendar" },
  { id: "map", label: "マップ", href: "/map" },
  { id: "social", label: "SNS", href: "/social" },
];

export default function AppHeader({
  oshiName,
  activeSection,
  showSectionTabs = false,
}: {
  oshiName?: string;
  activeSection?: AppSection;
  showSectionTabs?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = oshiName ? `${oshiName}の推しごとマップ` : "推しごとマップ";

  return (
    <header className="relative z-30 border-b bg-white px-4 pb-3 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/calendar" className="min-w-0 text-lg font-bold" aria-label={title}>
          <span className="block truncate">{title}</span>
        </Link>
        <button
          type="button"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          aria-controls="app-header-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {menuOpen ? (
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          ) : (
            <span aria-hidden="true" className="flex w-5 flex-col gap-1">
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
            </span>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="app-header-menu"
          aria-label="クイックメニュー"
          className="absolute right-4 top-full z-40 mt-2 min-w-48 rounded-xl border bg-white p-2 shadow-lg"
        >
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={section.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={activeSection === section.id ? "page" : undefined}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-purple-50"
                >
                  {section.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/onboarding"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-purple-50"
              >
                推し情報を編集
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {showSectionTabs && (
        <nav aria-label="メインナビゲーション" className="mt-3 flex gap-2">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              aria-current={activeSection === section.id ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm ${
                activeSection === section.id
                  ? "bg-[#FF2D78] font-semibold text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
