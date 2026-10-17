import { NextRequest, NextResponse } from "next/server";
import whitelist from "@/data/whitelisted_sources.json";

type SourceKind = "official" | "media" | "events" | "social";
type SourceStatus = "ok" | "error" | "unavailable";

type NewsItem = {
  id: string;
  source: string;
  kind: "official" | "media";
  title: string;
  url: string;
  publishedAt?: string;
};

type EventItem = {
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

type SourceResult<T> = {
  items: T[];
  status: SourceStatus;
  message?: string;
};

type OfficialWebsiteSource = {
  name: string;
  url: string;
  domain: string;
  keywords: string[];
};

const REQUEST_TIMEOUT_MS = 9000;
const MAX_SOURCE_BYTES = 1_500_000;

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'");
}

function plainText(value: string) {
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decodeEntities(withoutCdata.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getXmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? plainText(match[1]) : "";
}

function safeSourceUrl(rawUrl: string, allowedHost: string) {
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    (url.hostname !== allowedHost && !url.hostname.endsWith(`.${allowedHost}`))
  ) {
    throw new Error("許可されたホスト以外のURLは取得できません");
  }
  return url;
}

async function fetchWhitelistedText(rawUrl: string, allowedHost: string) {
  const url = safeSourceUrl(rawUrl, allowedHost);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
      "user-agent": "OshigotoMap/1.0 (+whitelist-only public source reader)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const finalUrl = safeSourceUrl(response.url || url.href, allowedHost);
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_SOURCE_BYTES) {
    throw new Error("取得データが上限サイズを超えました");
  }
  return { body, url: finalUrl };
}

function termsMatch(queryTerms: string[], sourceTerms: string[] = []) {
  const normalizedTerms = sourceTerms.map((term) => term.toLocaleLowerCase("ja-JP"));
  return queryTerms.some((term) =>
    normalizedTerms.includes(term.toLocaleLowerCase("ja-JP")),
  );
}

function titleMatchesQuery(title: string, queryTerms: string[]) {
  const normalizedTitle = title.toLocaleLowerCase("ja-JP");
  return queryTerms.some((term) => normalizedTitle.includes(term.toLocaleLowerCase("ja-JP")));
}

function sourceError(error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") {
    return "接続がタイムアウトしました";
  }
  if (error instanceof Error && /^HTTP \d{3}$/.test(error.message)) {
    return error.message;
  }
  return "取得した内容を読み取れませんでした";
}

async function fetchOfficialNews(
  source: OfficialWebsiteSource,
): Promise<SourceResult<NewsItem>> {
  try {
    const { body, url } = await fetchWhitelistedText(source.url, source.domain);
    const items: NewsItem[] = [];
    const anchors = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

    for (const match of body.matchAll(anchors)) {
      const href = decodeEntities(match[2].trim());
      const titleText = plainText(match[3]);
      if (!titleText) continue;

      const target = new URL(href, url);
      if (
        target.protocol !== "https:" ||
        target.hostname !== source.domain ||
        !target.pathname.startsWith("/headline/")
      ) {
        continue;
      }

      const dateMatch = titleText.match(/^(\d{4})[./年-](\d{1,2})[./月-](\d{1,2})(?:日)?\s*/);
      const title = titleText.replace(/^(\d{4})[./年-](\d{1,2})[./月-](\d{1,2})(?:日)?\s*/, "").trim();
      if (!title || items.some((item) => item.url === target.href)) continue;

      items.push({
        id: `official:${target.href}`,
        source: source.name,
        kind: "official",
        title,
        url: target.href,
        publishedAt: dateMatch
          ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
          : undefined,
      });
      if (items.length >= 20) break;
    }

    if (items.length === 0) {
      throw new Error("公式サイトからニュース一覧を確認できませんでした");
    }
    return { items, status: "ok" };
  } catch (error) {
    return { items: [], status: "error", message: sourceError(error) };
  }
}

async function fetchMediaFeed(
  source: (typeof whitelist.copyrighted_media)[number],
  queryTerms: string[],
): Promise<SourceResult<NewsItem>> {
  try {
    if (source.enabled !== true || !source.feedHost) {
      return {
        items: [],
        status: "unavailable",
        message: source.note,
      };
    }

    const { body } = await fetchWhitelistedText(source.rss, source.feedHost);
    if (!/<(?:rss|feed|rdf:RDF)\b/i.test(body)) {
      throw new Error("RSSフィード形式ではありません");
    }

    const items: NewsItem[] = [];
    for (const match of body.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
      const itemXml = match[1];
      const title = getXmlValue(itemXml, "title");
      const rawLink = getXmlValue(itemXml, "link");
      if (!title || !rawLink || !titleMatchesQuery(title, queryTerms)) continue;

      let target: URL;
      try {
        target = new URL(rawLink);
      } catch {
        continue;
      }
      if (
        target.protocol !== "https:" ||
        (target.hostname !== source.domain && !target.hostname.endsWith(`.${source.domain}`))
      ) {
        continue;
      }

      const publishedAtRaw = getXmlValue(itemXml, "pubDate");
      const publishedTime = publishedAtRaw ? Date.parse(publishedAtRaw) : Number.NaN;
      items.push({
        id: `media:${target.href}`,
        source: source.name,
        kind: "media",
        title,
        url: target.href,
        publishedAt: Number.isFinite(publishedTime)
          ? new Date(publishedTime).toISOString()
          : undefined,
      });
      if (items.length >= 30) break;
    }

    return { items, status: "ok" };
  } catch (error) {
    return { items: [], status: "error", message: sourceError(error) };
  }
}

function toJstDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function fetchOfficialEvents(
  source: (typeof whitelist.events)[number],
): Promise<SourceResult<EventItem>> {
  try {
    const { body } = await fetchWhitelistedText(source.url, source.domain);
    const datePattern =
      /<span\b[^>]*class=["'][^"']*\btxt__strong\b[^"']*["'][^>]*>\s*■?(\d{4})年(\d{1,2})月(\d{1,2})日[^<]*<\/span>/gi;
    const dates = [...body.matchAll(datePattern)];
    if (dates.length === 0) {
      throw new Error("公式イベント日程を確認できませんでした");
    }

    const today = toJstDateKey(new Date());
    const items: EventItem[] = [];
    dates.forEach((dateMatch, index) => {
      const blockStart = (dateMatch.index ?? 0) + dateMatch[0].length;
      const blockEnd = dates[index + 1]?.index ?? body.length;
      const eventBlock = body.slice(blockStart, blockEnd);
      const venueMatch = eventBlock.match(
        /<span\b[^>]*class=["'][^"']*\btxt__alert_strong\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      );
      const timeMatch = eventBlock.match(/開場\s*([0-2]?\d:\d{2})\s*\/\s*開演\s*([0-2]?\d:\d{2})/);
      const venue = venueMatch ? plainText(venueMatch[1]) : "";
      if (!venue) return;

      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, "0");
      const day = dateMatch[3].padStart(2, "0");
      const date = `${year}-${month}-${day}`;
      if (date < today) return;

      const prefectureMatch = venue.match(/[〈〈<]([^〉〉>]+)[〉〉>]/);
      items.push({
        id: `event:${date}:${venue}`,
        source: source.name,
        title: source.name,
        date,
        venue: venue.replace(/[〈〈<][^〉〉>]+[〉〉>]/, "").trim(),
        prefecture: prefectureMatch?.[1],
        openTime: timeMatch?.[1],
        startTime: timeMatch?.[2],
        url: source.url,
      });
    });

    return { items, status: "ok" };
  } catch (error) {
    return { items: [], status: "error", message: sourceError(error) };
  }
}

function sourceStatus(name: string, kind: SourceKind, result: SourceResult<unknown>) {
  return {
    name,
    kind,
    status: result.status,
    ...(result.message ? { message: result.message } : {}),
  };
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const queryTerms = [...new Set(rawQuery.split(/[,\n]/).map((term) => term.trim()).filter(Boolean))]
    .slice(0, 8);

  if (queryTerms.length === 0 || rawQuery.length > 300) {
    return NextResponse.json(
      {
        status: "error",
        message: "検索する名前を入力してください。",
        news: [],
        events: [],
        sourceStatuses: [],
      },
      { status: 400 },
    );
  }

  const official = whitelist.official
    .filter(
      (source) =>
        source.type === "website" &&
        Boolean(source.url && source.domain) &&
        termsMatch(queryTerms, source.keywords),
    )
    .map((source) => ({
      name: source.name,
      url: source.url!,
      domain: source.domain!,
      keywords: source.keywords ?? [],
    }));
  const eventSources = whitelist.events.filter((source) =>
    termsMatch(queryTerms, source.keywords),
  );
  const enabledMedia = whitelist.copyrighted_media.filter((source) => source.enabled === true);

  const newsResults = await Promise.all([
    ...official.map((source) => fetchOfficialNews(source)),
    ...enabledMedia.map((source) => fetchMediaFeed(source, queryTerms)),
  ]);
  const eventResults = await Promise.all(eventSources.map(fetchOfficialEvents));

  const news = newsResults.flatMap((result) => result.items);
  const events = eventResults.flatMap((result) => result.items);
  const activeStatuses = [
    ...official.map((source, index) =>
      sourceStatus(source.name, "official", newsResults[index]),
    ),
    ...enabledMedia.map((source, index) =>
      sourceStatus(source.name, "media", newsResults[official.length + index]),
    ),
    ...eventSources.map((source, index) =>
      sourceStatus(source.name, "events", eventResults[index]),
    ),
  ];

  const unavailableStatuses = [
    ...whitelist.official
      .filter((source) => source.type === "social" && source.enabled !== true)
      .map((source) => ({
        name: source.name,
        kind: "social" as const,
        status: "unavailable" as const,
        message: source.note,
      })),
    ...whitelist.related_official.map((source) => ({
      name: source.name,
      kind: "social" as const,
      status: "unavailable" as const,
      message: source.note,
    })),
    ...whitelist.copyrighted_media
      .filter((source) => source.enabled !== true)
      .map((source) => ({
        name: source.name,
        kind: "media" as const,
        status: "unavailable" as const,
        message: source.note,
      })),
  ];

  const hasError = activeStatuses.some((source) => source.status === "error");
  const hasSuccess = activeStatuses.some((source) => source.status === "ok");
  const hasResults = news.length > 0 || events.length > 0;
  const status = hasError
    ? hasSuccess
      ? "partial"
      : "error"
    : hasResults
      ? "ok"
      : "empty";

  return NextResponse.json(
    {
      status,
      news,
      events,
      sourceStatuses: [...activeStatuses, ...unavailableStatuses],
      notice:
        "メディア記事はタイトルとリンクのみ表示します。Modelpress RSSは非営利利用に限られます。SNS投稿は認証なしで検索できる公式APIがないため取得しません。",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
