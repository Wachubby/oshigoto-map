"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWhitelistSearch } from "@/hooks/useWhitelistSearch";
import type { EventItem } from "@/hooks/useWhitelistSearch";
import {
  OSHI_NAME_STORAGE_KEY,
  readOshiProfile,
  type OshiSearchProfile,
} from "@/lib/oshi-profile";

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function EventDetails({ event }: { event: EventItem }) {
  return (
    <article className="rounded-xl border border-purple-100 bg-white p-3 text-sm">
      <p className="font-semibold">{event.title}</p>
      <p className="mt-1">{event.venue}{event.prefecture ? `（${event.prefecture}）` : ""}</p>
      {(event.openTime || event.startTime) && (
        <p className="mt-1 text-xs text-gray-500">
          {event.openTime && `開場 ${event.openTime}`}
          {event.openTime && event.startTime && " / "}
          {event.startTime && `開演 ${event.startTime}`}
        </p>
      )}
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs underline underline-offset-2"
      >
        公式日程を確認
      </a>
    </article>
  );
}

export default function Calendar() {
  const [oshi, setOshi] = useState<OshiSearchProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { data, loading, error, retry } = useWhitelistSearch(
    oshi ?? {},
    Boolean(oshi),
  );
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const events = data?.events ?? [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();

  useEffect(() => {
    try {
      const name = localStorage.getItem(OSHI_NAME_STORAGE_KEY)?.trim();
      if (!name) {
        setProfileError("推しの名前が見つかりません。先に登録してください。");
        return;
      }
      const saved = readOshiProfile(localStorage);
      setOshi({
        formal: name,
        nicknames: saved
          ? [saved.helper1, saved.helper2, saved.helper3].filter(Boolean)
          : [],
      });
    } catch (cause) {
      setProfileError(
        cause instanceof Error ? cause.message : "推し情報を読み取れませんでした。",
      );
    }
  }, []);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, EventItem[]>();
    for (const event of events) {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    }
    return grouped;
  }, [events]);
  const monthEvents = events.filter((event) =>
    event.date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`),
  );
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];
  const eventStatuses = data?.sourceStatuses.filter((source) => source.kind === "events") ?? [];
  const eventErrors = eventStatuses.filter((source) => source.status === "error");
  const eventFailed = eventErrors.length > 0 && !eventStatuses.some((source) => source.status === "ok");
  const eventIsEmpty = !loading && !error && events.length === 0 && eventErrors.length === 0;

  useEffect(() => {
    if (!sheetOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSheetOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sheetOpen]);

  function openSheetForDate(date: string | null) {
    setSelectedDate(date);
    setSheetOpen(Boolean(date));
  }

  return (
    <div className="relative h-[calc(100vh-112px)] min-h-[560px] overflow-hidden">
      <div className="h-full overflow-y-auto p-4 pb-24">
        <h1 className="text-xl font-bold">{oshi?.formal ?? "推し"}</h1>
        <p className="mb-3 text-xs text-gray-500">公式に確認できた公演日程</p>

        {profileError && (
          <div role="alert" className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm">
            {profileError}
            <Link href="/onboarding" className="ml-2 underline">登録へ</Link>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            aria-label="前の月"
            className="rounded border px-3 py-1"
          >
            ‹
          </button>
          <h2 className="font-semibold">{year}年{monthIndex + 1}月</h2>
          <button
            type="button"
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            aria-label="次の月"
            className="rounded border px-3 py-1"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div key={day} className="py-1 font-semibold text-gray-500">{day}</div>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <div key={`blank-${index}`} aria-hidden="true" />
          ))}
          {Array.from({ length: dayCount }, (_, index) => {
            const day = index + 1;
            const key = dateKey(year, monthIndex, day);
            const dayEvents = eventsByDate.get(key) ?? [];
            const selected = selectedDate === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => openSheetForDate(dayEvents.length ? key : null)}
                aria-label={`${monthIndex + 1}月${day}日${dayEvents.length ? `、公演${dayEvents.length}件` : ""}`}
                aria-pressed={selected}
                className={`flex h-10 flex-col items-center justify-center rounded ${
                  dayEvents.length ? "border border-purple-200 bg-purple-50 font-semibold" : ""
                } ${selected ? "ring-2 ring-purple-700" : ""}`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <span className="mt-0.5 text-[9px] text-purple-700">{dayEvents.length}件</span>
                )}
              </button>
            );
          })}
        </div>

        {loading && <p role="status" className="mt-4 text-sm text-gray-500">公式日程を確認しています…</p>}
        {error && (
          <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm">
            公式日程を取得できませんでした。
            <button type="button" onClick={retry} className="ml-2 underline">再試行</button>
          </div>
        )}
        {!loading && !error && eventFailed && (
          <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm">
            公式日程に接続できませんでした。
            <button type="button" onClick={retry} className="ml-2 underline">再試行</button>
          </div>
        )}
        {!loading && !error && eventErrors.length > 0 && !eventFailed && (
          <p role="status" className="mt-3 text-xs text-amber-700">
            一部の公式イベント情報に接続できませんでした。表示中の予定は取得できた情報源からのものです。
          </p>
        )}
        {eventIsEmpty && (
          <p role="status" className="mt-4 rounded border p-3 text-sm text-gray-500">
            この名前に対応するホワイトリスト内の公式イベント日程はありません。
          </p>
        )}
        {!loading && !error && events.length > 0 && monthEvents.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">この月に確認できる公演はありません。</p>
        )}
        {monthEvents.length > 0 && (
          <section className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold">この月の公演（{monthEvents.length}件）</h3>
            {monthEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => openSheetForDate(event.date)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm"
              >
                <span>{Number(event.date.slice(5, 7))}/{Number(event.date.slice(8, 10))} · {event.title}</span>
                <span aria-hidden="true" className="text-gray-400">›</span>
              </button>
            ))}
          </section>
        )}
      </div>

      {sheetOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="calendar-sheet-title"
          className="absolute inset-x-0 bottom-0 z-10 max-h-[62%] overflow-y-auto rounded-t-2xl border-t border-purple-100 bg-white px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgba(42,18,65,0.18)]"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id="calendar-sheet-title" className="font-semibold">
              {selectedDate ? `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日の公演` : "公演"}
            </h3>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="公演詳細を閉じる"
              className="rounded-full px-3 py-1 text-lg text-gray-500"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {selectedEvents.map((event) => <EventDetails key={event.id} event={event} />)}
          </div>
        </section>
      )}
    </div>
  );
}
