"use client";

import { useMemo, useState } from "react";
import { useWhitelistSearch } from "@/hooks/useWhitelistSearch";
import type { EventItem } from "@/hooks/useWhitelistSearch";

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function EventDetails({ event }: { event: EventItem }) {
  return (
    <article className="rounded-lg border p-3 text-sm">
      <p className="font-semibold">{event.title}</p>
      <p className="mt-1">{event.venue}{event.prefecture ? `（${event.prefecture}）` : ""}</p>
      {(event.openTime || event.startTime) && (
        <p className="mt-1 text-xs text-gray-500">
          {event.openTime && `開場 ${event.openTime}`}
          {event.openTime && event.startTime && " / "}
          {event.startTime && `開演 ${event.startTime}`}
        </p>
      )}
      <a href={event.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline">
        公式日程を確認
      </a>
    </article>
  );
}

export default function CalendarView({ oshi }: { oshi: any }) {
  const { data, loading, error, retry } = useWhitelistSearch(oshi);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const events = data?.events ?? [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, EventItem[]>();
    for (const event of events) {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    }
    return grouped;
  }, [events]);
  const monthEvents = events.filter((event) => event.date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`));
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];
  const eventStatuses = data?.sourceStatuses.filter((source) => source.kind === "events") ?? [];
  const eventErrors = eventStatuses.filter((source) => source.status === "error");
  const sourceIssues = eventErrors;
  const eventFailed = eventErrors.length > 0 && !eventStatuses.some((source) => source.status === "ok");
  const eventIsEmpty = !loading && !error && events.length === 0 && eventErrors.length === 0;

  return (
    <div className="h-full overflow-y-auto p-4">
      <h1 className="text-xl font-bold">{oshi.formal}</h1>
      <p className="mb-3 text-xs text-gray-500">公式に確認できた公演日程</p>

      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
          aria-label="前の月"
          className="rounded border px-3 py-1"
        >
          ‹
        </button>
        <h2 className="font-semibold">{year}年{monthIndex + 1}月</h2>
        <button
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
              onClick={() => setSelectedDate(dayEvents.length ? key : null)}
              aria-label={`${monthIndex + 1}月${day}日${dayEvents.length ? `、公演${dayEvents.length}件` : ""}`}
              aria-pressed={selected}
              className={`flex h-10 flex-col items-center justify-center rounded ${dayEvents.length ? "border border-pink-200 bg-pink-50 font-semibold" : ""} ${selected ? "ring-2 ring-[#FF2D78]" : ""}`}
            >
              {day}
              {dayEvents.length > 0 && (
                <span className="mt-0.5 text-[9px] text-[#FF2D78]">{dayEvents.length}件</span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <p role="status" className="mt-4 text-sm text-gray-500">公式日程を確認しています…</p>
      )}
      {error && (
        <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm">
          公式日程を取得できませんでした。
          <button onClick={retry} className="ml-2 underline">再試行</button>
        </div>
      )}
      {!loading && !error && eventFailed && (
        <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm">
          公式日程に接続できませんでした。
          <button onClick={retry} className="ml-2 underline">再試行</button>
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
      {!loading && !error && events.length === 0 && eventErrors.length > 0 && !eventFailed && (
        <p role="status" className="mt-4 rounded border p-3 text-sm text-gray-500">
          接続できた公式情報源に、これからの公演はありません。接続できなかった情報源には予定がある可能性があります。
        </p>
      )}

      {selectedEvents.length > 0 && (
        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold">{selectedDate?.slice(5).replace("-", "/")} の公演</h3>
          {selectedEvents.map((event) => <EventDetails key={event.id} event={event} />)}
        </section>
      )}

      {monthEvents.length > 0 && (
        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold">この月の公演（{monthEvents.length}件）</h3>
          {monthEvents.map((event) => (
            <div key={event.id} onClick={() => setSelectedDate(event.date)}>
              <EventDetails event={event} />
            </div>
          ))}
        </section>
      )}

      {!loading && !error && events.length > 0 && monthEvents.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">この月に確認できる公演はありません。</p>
      )}

      {sourceIssues.length > 0 && (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">取得できない情報提供元について</summary>
          <ul className="mt-2 list-disc pl-4">
            {sourceIssues.map((source) => (
              <li key={source.name}>{source.name}：{source.message ?? "取得できませんでした"}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
