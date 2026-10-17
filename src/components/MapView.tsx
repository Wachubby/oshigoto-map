"use client";

import { useMemo, useState } from "react";
import { useWhitelistSearch } from "@/hooks/useWhitelistSearch";
import type { EventItem } from "@/hooks/useWhitelistSearch";

const PREFECTURE_POINTS: Record<string, { lat: number; lon: number }> = {
  北海道: { lat: 43.06, lon: 141.35 },
  福島: { lat: 37.75, lon: 140.47 },
  山形: { lat: 38.24, lon: 140.36 },
  宮城: { lat: 38.27, lon: 140.87 },
  埼玉: { lat: 35.86, lon: 139.65 },
  東京: { lat: 35.68, lon: 139.69 },
  愛知: { lat: 35.18, lon: 136.91 },
  静岡: { lat: 34.98, lon: 138.38 },
  富山: { lat: 36.70, lon: 137.21 },
  長野: { lat: 36.65, lon: 138.18 },
  大阪: { lat: 34.69, lon: 135.50 },
  兵庫: { lat: 34.69, lon: 135.20 },
  岡山: { lat: 34.66, lon: 133.93 },
  福岡: { lat: 33.59, lon: 130.40 },
  大分: { lat: 33.24, lon: 131.61 },
};

function mapPosition(prefecture?: string) {
  const point = prefecture ? PREFECTURE_POINTS[prefecture] : undefined;
  if (!point) return null;
  return {
    left: `${5 + ((point.lon - 129) / 16.5) * 88}%`,
    top: `${1 + ((45.6 - point.lat) / 15.1) * 96}%`,
  };
}

function eventDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default function MapView({ oshi }: { oshi: any }) {
  const { data, loading, error, retry } = useWhitelistSearch(oshi);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const events = data?.events ?? [];
  const mappedEvents = useMemo(
    () => events.map((event) => ({ event, position: mapPosition(event.prefecture) }))
      .filter((item): item is { event: EventItem; position: { left: string; top: string } } => Boolean(item.position)),
    [events],
  );
  const selectedEvent = events.find((event) => event.id === selected);
  const eventStatuses = data?.sourceStatuses.filter((source) => source.kind === "events") ?? [];
  const eventErrors = eventStatuses.filter((source) => source.status === "error");
  const eventFailed = eventErrors.length > 0 && !eventStatuses.some((source) => source.status === "ok");
  const eventIsEmpty = !loading && !error && events.length === 0 && eventErrors.length === 0;

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f8faf7]">
        <div className="relative aspect-square" style={{ width: "min(100%, 56vh)" }}>
          <img
            src="/japan-green-base.jpg"
            alt="日本地図。ピンは都道府県内の地域の目安です"
            className="absolute inset-0 h-full w-full object-contain"
          />
          {mappedEvents.map(({ event, position }, index) => (
            <button
              key={event.id}
              onClick={() => setSelected(event.id)}
              aria-label={`${eventDate(event.date)} ${event.venue}`}
              style={position}
              className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow ${selected === event.id ? "bg-black" : "bg-[#FF2D78]"}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {selectedEvent && (
          <div className="absolute left-3 right-3 top-3 rounded-xl border bg-white p-3 text-sm shadow-lg">
            <button onClick={() => setSelected(null)} aria-label="閉じる" className="absolute right-3 top-2">✕</button>
            <p className="pr-6 font-semibold">{selectedEvent.title}</p>
            <p className="mt-1">{eventDate(selectedEvent.date)} · {selectedEvent.venue}{selectedEvent.prefecture ? `（${selectedEvent.prefecture}）` : ""}</p>
            {selectedEvent.startTime && <p className="mt-1 text-xs text-gray-500">開演 {selectedEvent.startTime}</p>}
            <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline">
              公式日程を確認
            </a>
          </div>
        )}
      </div>

      {loading && <p role="status" className="border-t bg-white px-4 py-2 text-xs text-gray-500">公式イベントを確認しています…</p>}
      {error && (
        <div role="alert" className="border-t bg-red-50 px-4 py-2 text-xs text-red-800">
          イベント情報を取得できませんでした。<button onClick={retry} className="ml-1 underline">再試行</button>
        </div>
      )}
      {!loading && !error && eventFailed && (
        <div role="alert" className="border-t bg-red-50 px-4 py-2 text-xs text-red-800">
          公式日程に接続できませんでした。<button onClick={retry} className="ml-1 underline">再試行</button>
        </div>
      )}
      {eventIsEmpty && (
        <p role="status" className="border-t bg-white px-4 py-2 text-xs text-gray-500">
          この名前に対応する公式イベント日程はありません。
        </p>
      )}
      {eventErrors.length > 0 && !eventFailed && (
        <p className="border-t bg-white px-4 py-1 text-[10px] text-amber-700">一部のイベント情報源は利用できません。</p>
      )}

      <div className={`absolute bottom-0 left-0 right-0 rounded-t-2xl border-t bg-white shadow-xl ${open ? "max-h-[55%]" : "h-14"}`}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-14 w-full items-center justify-between px-4"
        >
          <span className="text-sm font-bold">
            {events.length}件の公式公演 · {mappedEvents.length}件を地図に表示
          </span>
          <span>{open ? "↓" : "↑"}</span>
        </button>
        {open && (
          <div className="h-[calc(100%-56px)] space-y-2 overflow-auto px-4 pb-4">
            {events.map((event, index) => (
              <button
                key={event.id}
                onClick={() => setSelected(event.id)}
                className="flex w-full items-start justify-between gap-2 rounded border p-2 text-left text-sm"
              >
                <span>{index + 1}. {eventDate(event.date)} {event.venue}{event.prefecture ? `（${event.prefecture}）` : ""}</span>
                <span className="shrink-0 text-xs text-gray-400">{event.startTime ? `${event.startTime}開演` : ""}</span>
              </button>
            ))}
            {events.length === 0 && !loading && <p className="text-sm text-gray-500">表示できる公式公演はありません。</p>}
            <p className="text-[10px] text-gray-400">ピンは都道府県内のおおよその位置で、会場の正確な座標ではありません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
