import { NextRequest, NextResponse } from "next/server";
import whitelist from "@/data/whitelisted_sources.json";
import venuesWhitelist from "@/data/venues_whitelist.json";
import { classifyVenueEvents } from "@/lib/filter";
import { fetchHelloProjectEvents, type OfficialEventSource } from "@/lib/helloproject-events";
import { UnknownVenueCollector } from "@/lib/unknown_venue_collector";
import type { EventItem, NewsItem, SourceStatus } from "@/hooks/useWhitelistSearch";

const unknownVenueCollector = new UnknownVenueCollector();
const allowedViews = new Set(["all", "calendar", "map", "social"]);
const mediaSources = whitelist.copyrighted_media;

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatchesQuery(title: string, terms: string[]) {
  const normalizedTitle = title.toLocaleLowerCase("ja-JP");
  return terms.some((term) => normalizedTitle.includes(term.toLocaleLowerCase("ja-JP")));
}

async function fetchMediaNews(queryTerms: string[], sourceStatuses: SourceStatus[]) {
  const news: NewsItem[] = [];
  for (const source of mediaSources) {
    if (source.enabled !== true) {
      sourceStatuses.push({
        name: source.name,
        kind: "media",
        status: "unavailable",
        message: "このRSS情報源は現在無効です。",
      });
      continue;
    }

    try {
      const response = await fetch(source.rss, {
        cache: "no-store",
        headers: {
          accept: "application/rss+xml, application/xml, text/xml",
          "user-agent": "OshigotoMap/1.0 (+whitelist-only; contact info@wachubby.com)",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      if (body.includes("cf-challenge") || body.includes("Just a moment")) {
        throw new Error("人間確認ページ");
      }

      const items = [...body.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];
      for (const match of items) {
        const xml = match[1];
        const title = (
          xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
        )
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
          .trim();
        const link = (xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
        if (!title || !link || !titleMatchesQuery(title, queryTerms)) continue;
        news.push({
          id: `media:${link}`,
          source: source.name,
          kind: "media",
          title: plainText(title),
          url: link,
        });
        if (news.length >= 30) break;
      }
      sourceStatuses.push({ name: source.name, kind: "media", status: "ok" });
    } catch (cause) {
      sourceStatuses.push({
        name: source.name,
        kind: "media",
        status: "error",
        message: cause instanceof Error ? cause.message : "RSSを取得できませんでした",
      });
    }
  }
  return news;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get("q") ?? "";
  const queryTerms = [...new Set(rawQuery.split(/[,\n]/).map((term) => term.trim()).filter(Boolean))]
    .slice(0, 12);
  const name = searchParams.get("name")?.trim() || queryTerms[0] || "";
  const providedHelpers = searchParams.getAll("helper").map((helper) => helper.trim()).filter(Boolean);
  const helpers = providedHelpers.length > 0 ? providedHelpers : queryTerms.slice(1);
  const displayName = searchParams.get("displayName")?.trim() || helpers[0] || name;
  const requestedView = searchParams.get("view") ?? "all";
  const view = allowedViews.has(requestedView) ? requestedView : "all";

  if (!name && queryTerms.length === 0) {
    return NextResponse.json({
      status: "empty",
      news: [],
      events: [],
      mapEvents: [],
      sourceStatuses: [],
      notice: "推しを登録して公式スケジュールを確認してください。",
    });
  }

  const sourceStatuses: SourceStatus[] = [];
  const includeNews = view === "all" || view === "social";
  const includeEvents = view !== "social";
  const news: NewsItem[] = [];
  let events: EventItem[] = [];
  let mapEvents: EventItem[] = [];
  let eventMode: "A" | "B" | undefined;

  if (includeNews) {
    for (const platform of whitelist.platforms) {
      sourceStatuses.push({
        name: platform.name,
        kind: "social",
        status: "unavailable",
        message: `${platform.domain}は公式検索APIが未設定のため、登録済み個別投稿URLのみ確認します。`,
      });
    }
    news.push(...await fetchMediaNews(queryTerms, sourceStatuses));
  }

  if (includeEvents) {
    const source = whitelist.official.find(
      (item) =>
        item.type === "event-schedule" &&
        item.groupName === "Juice=Juice",
    ) as OfficialEventSource | undefined;

    if (!source) {
      sourceStatuses.push({
        name: "Juice=Juice official schedule",
        kind: "events",
        status: "error",
        message: "公式イベント情報源がホワイトリストにありません。",
      });
    } else {
      try {
        const result = await fetchHelloProjectEvents(source, {
          name,
          displayName,
          helpers,
        });
        events = result.events;
        eventMode = result.mode;
        const classification = classifyVenueEvents(
          events,
          venuesWhitelist.venues,
          unknownVenueCollector,
        );
        mapEvents = classification.approved;
        sourceStatuses.push({
          name: source.name,
          kind: "events",
          status: "ok",
          message: `Mode ${result.mode} · ${events.length}件の公式日程`,
        });
      } catch (cause) {
        sourceStatuses.push({
          name: source.name,
          kind: "events",
          status: "error",
          message: cause instanceof Error ? cause.message : "公式日程を取得できませんでした。",
        });
      }
    }
  }

  return NextResponse.json(
    {
      status: news.length || events.length ? "ok" : "empty",
      news,
      events,
      mapEvents,
      eventMode,
      sourceStatuses,
      notice: "Calendar uses whitelisted official sources; Map only shows events at approved venues.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
