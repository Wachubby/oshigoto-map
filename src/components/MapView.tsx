"use client";

import { useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useWhitelistSearch } from "@/hooks/useWhitelistSearch";
import type { EventItem } from "@/hooks/useWhitelistSearch";
import { geocodeVenue, type VenueCoordinates } from "@/lib/geocode";
import type { OshiSearchProfile } from "@/lib/oshi-profile";

function eventDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

const mapContainerStyle = { width: "100%", height: "100%" };
const japanCenter = { lat: 36.2, lng: 138.25 };

export default function MapView({ oshi }: { oshi: OshiSearchProfile }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "oshigoto-map-google",
    googleMapsApiKey: apiKey,
  });
  const { data, loading, error, retry } = useWhitelistSearch(oshi, true, "map");
  const [selected, setSelected] = useState<string | null>(null);
  const [location, setLocation] = useState<VenueCoordinates | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const latestRequest = useRef(0);
  const events = data?.mapEvents ?? [];
  const officialEvents = data?.events ?? [];
  const selectedEvent = events.find((event) => event.id === selected);
  const eventStatuses = data?.sourceStatuses.filter((source) => source.kind === "events") ?? [];
  const eventErrors = eventStatuses.filter((source) => source.status === "error");
  const eventFailed = eventErrors.length > 0 && !eventStatuses.some((source) => source.status === "ok");
  const eventIsEmpty =
    !loading &&
    !error &&
    events.length === 0 &&
    officialEvents.length === 0 &&
    eventErrors.length === 0;
  const noApprovedVenueEvents =
    !loading &&
    !error &&
    events.length === 0 &&
    officialEvents.length > 0;

  async function selectEvent(event: EventItem) {
    const requestId = ++latestRequest.current;
    setSelected(event.id);
    setLocation(null);
    setGeocodeError(null);
    setGeocoding(true);
    try {
      const result = await geocodeVenue(event.venue, event.prefecture);
      if (requestId !== latestRequest.current) return;
      if (!result) {
        setGeocodeError("会場の位置を地図で確認できませんでした。");
        return;
      }
      setLocation(result);
    } catch {
      if (requestId === latestRequest.current) {
        setGeocodeError("会場の位置を取得できませんでした。Google Cloud で Geocoding API とキー制限を確認してください。");
      }
    } finally {
      if (requestId === latestRequest.current) setGeocoding(false);
    }
  }

  function closeSelectedEvent() {
    latestRequest.current += 1;
    setSelected(null);
    setLocation(null);
    setGeocodeError(null);
    setGeocoding(false);
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "calc(100vh - 116px)", minHeight: "560px" }}
    >
      {!apiKey && (
        <div role="alert" className="absolute inset-x-3 top-3 z-10 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 shadow">
          地図を表示するには `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を設定してください。
        </div>
      )}
      {loadError && apiKey && (
        <div role="alert" className="absolute inset-x-3 top-3 z-10 rounded-lg bg-red-50 p-3 text-sm text-red-800 shadow">
          Google マップを読み込めませんでした。Maps JavaScript API の設定を確認してください。
        </div>
      )}
      {isLoaded && apiKey ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={location ?? japanCenter}
          zoom={location ? 14 : 5}
          options={{
            clickableIcons: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
          }}
        >
          {selectedEvent && location && (
            <MarkerF
              position={location}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#FFFFFF",
                fillOpacity: 1,
                strokeColor: "#6D28D9",
                strokeWeight: 3,
                scale: 16,
              }}
              label={{
                text: eventDate(selectedEvent.date),
                color: "#5B21B6",
                fontSize: "8px",
                fontWeight: "700",
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="flex h-full items-center justify-center bg-[#f8f7fb] text-sm text-gray-500">
          {apiKey ? "地図を読み込んでいます…" : "地図の設定を確認しています…"}
        </div>
      )}

      {selectedEvent && (
        <div className="absolute left-3 right-3 top-3 z-10 rounded-xl border bg-white p-3 text-sm shadow-lg">
          <button
            type="button"
            onClick={closeSelectedEvent}
            aria-label="選択した公演を閉じる"
            className="absolute right-3 top-2"
          >
            ✕
          </button>
          <p className="pr-6 font-semibold">{selectedEvent.title}</p>
          <p className="mt-1">{eventDate(selectedEvent.date)} · {selectedEvent.venue}{selectedEvent.prefecture ? `（${selectedEvent.prefecture}）` : ""}</p>
          {selectedEvent.startTime && <p className="mt-1 text-xs text-gray-500">開演 {selectedEvent.startTime}</p>}
          {geocoding && <p role="status" className="mt-1 text-xs text-gray-500">会場の位置を確認しています…</p>}
          {geocodeError && <p role="alert" className="mt-1 text-xs text-amber-800">{geocodeError}</p>}
          <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline">
            公式日程を確認
          </a>
        </div>
      )}

      {loading && <p role="status" className="absolute left-0 right-0 top-0 bg-white/90 px-4 py-2 text-xs text-gray-500">公式イベントを確認しています…</p>}
      {error && (
        <div role="alert" className="absolute left-0 right-0 top-0 bg-red-50 px-4 py-2 text-xs text-red-800">
          イベント情報を取得できませんでした。<button type="button" onClick={retry} className="ml-1 underline">再試行</button>
        </div>
      )}
      {!loading && !error && eventFailed && (
        <div role="alert" className="absolute left-0 right-0 top-0 bg-red-50 px-4 py-2 text-xs text-red-800">
          公式日程に接続できませんでした。<button type="button" onClick={retry} className="ml-1 underline">再試行</button>
        </div>
      )}
      {eventIsEmpty && (
        <p role="status" className="absolute left-3 right-3 top-3 rounded-lg bg-white/95 p-3 text-xs text-gray-500 shadow">
          この名前に対応する公式イベント日程はありません。
        </p>
      )}
      {noApprovedVenueEvents && (
        <p role="status" className="absolute left-3 right-3 top-3 rounded-lg bg-white/95 p-3 text-xs text-gray-500 shadow">
          公式日程はありますが、会場がマップの許可リストにないためピンは表示していません。
        </p>
      )}
      {eventErrors.length > 0 && !eventFailed && (
        <p className="absolute left-0 right-0 top-0 bg-white/90 px-4 py-1 text-[10px] text-amber-700">
          一部のイベント情報源は利用できません。
        </p>
      )}

      <section
        aria-label="公式公演リスト"
        className={`absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl border-t bg-white shadow-[0_-8px_30px_rgba(42,18,65,0.18)] ${
          open ? "h-[48%]" : "h-14"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-14 w-full items-center justify-between px-4"
        >
          <span className="text-sm font-bold">{events.length}件の公式公演</span>
          <span aria-hidden="true">{open ? "↓" : "↑"}</span>
        </button>
        {open && (
          <div className="h-[calc(100%-56px)] space-y-2 overflow-auto px-4 pb-24">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => void selectEvent(event)}
                aria-pressed={selected === event.id}
                className={`flex w-full items-start justify-between gap-2 rounded border p-2 text-left text-sm ${
                  selected === event.id ? "border-purple-500 bg-purple-50" : ""
                }`}
              >
                <span>{eventDate(event.date)} · {event.venue}{event.prefecture ? `（${event.prefecture}）` : ""}</span>
                <span className="shrink-0 text-xs text-gray-400">{event.startTime ? `${event.startTime}開演` : ""}</span>
              </button>
            ))}
            {events.length === 0 && !loading && (
              <p className="text-sm text-gray-500">表示できる公式公演はありません。</p>
            )}
            <p className="text-[10px] text-gray-400">
              位置情報は選択した会場のみ取得します。ピンには日付だけを表示します。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
