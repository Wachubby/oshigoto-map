"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type NewsItem = {
  id: string;
  source: string;
  kind: "official" | "media" | "social";
  title?: string;
  url: string;
  publishedAt?: string;
  author?: string;
  authorType?: "group" | "personal" | "other";
  caption?: string;
  tags?: string[];
};

export type EventItem = {
  id: string;
  source: string;
  title: string;
  date: string;
  venue: string;
  prefecture?: string;
  openTime?: string;
  startTime?: string;
  url: string;
};

export type SourceStatus = {
  name: string;
  kind: "official" | "media" | "events" | "social";
  status: "ok" | "error" | "unavailable";
  message?: string;
};

export type WhitelistSearchResponse = {
  status: "ok" | "empty" | "partial" | "error";
  news: NewsItem[];
  events: EventItem[];
  sourceStatuses: SourceStatus[];
  notice?: string;
  message?: string;
};

export function useWhitelistSearch(oshi: {
  formal?: string;
  nicknames?: string[];
}, enabled = true) {
  const query = useMemo(
    () => [oshi.formal, ...(oshi.nicknames ?? [])].filter(Boolean).join(","),
    [oshi.formal, oshi.nicknames],
  );
  const [data, setData] = useState<WhitelistSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/whitelist-search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as WhitelistSearchResponse;
        if (!response.ok) {
          throw new Error(payload.message || "情報を取得できませんでした。");
        }
        return payload;
      })
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "情報を取得できませんでした。");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, query, refresh]);

  const retry = useCallback(() => setRefresh((value) => value + 1), []);

  return { data, loading, error, retry };
}
