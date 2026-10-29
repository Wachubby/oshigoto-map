import type { ReactNode } from "react";
import Link from "next/link";

type AppSection = "calendar" | "map" | "social";

const items: {
  id: AppSection;
  label: string;
  href: string;
  icon: ReactNode;
}[] = [
  {
    id: "calendar",
    label: "カレンダー",
    href: "/calendar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h2m4 0h2M8 17h2m4 0h2" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "マップ",
    href: "/map",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    id: "social",
    label: "ソーシャル",
    href: "/social",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3.5 2v-5A7.5 7.5 0 1 1 20 11.5Z" />
        <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNavigation({
  activeSection,
}: {
  activeSection: AppSection;
}) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl border-t border-gray-200 bg-white/95 px-2 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-3">
        {items.map((item) => {
          const active = activeSection === item.id;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? "font-semibold text-[#D91C67]" : "text-gray-500"
                }`}
              >
                <span className="h-5 w-5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
