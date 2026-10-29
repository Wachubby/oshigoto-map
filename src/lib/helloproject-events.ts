import {
  filterOfficialGroupEvents,
  type OfficialGroupEventCandidate,
} from "@/lib/filter";
import type { EventItem } from "@/hooks/useWhitelistSearch";

export type OfficialEventSource = {
  name: string;
  domain: string;
  url: string;
  eventPathPrefix: string;
  groupName: string;
};

type EventCard = OfficialGroupEventCandidate & {
  href: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_match, hex: string, decimal: string) =>
      String.fromCodePoint(Number.parseInt(hex ?? decimal, hex ? 16 : 10)),
    );
}

function htmlToText(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(?:div|p|li|span|h[1-6])>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function classContent(html: string, className: string) {
  const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class=["'][^"']*\\b${escapedClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i"),
  );
  return match?.[2] ?? "";
}

function extractEventCards(html: string, source: OfficialEventSource): EventCard[] {
  const origin = new URL(source.url).origin;
  const cards: EventCard[] = [];

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = match[1];
    const body = match[2];
    const className = attributes.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? "";
    const href = attributes.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || !className.includes("EventPanel")) continue;

    const eventUrl = new URL(href, source.url);
    if (
      eventUrl.origin !== origin ||
      !eventUrl.pathname.startsWith(source.eventPathPrefix)
    ) {
      continue;
    }

    const title = htmlToText(classContent(body, "EventPanel__title"));
    if (!title) continue;

    const tagsHtml = classContent(body, "TagList");
    const groupNames = [...tagsHtml.matchAll(/<[^>]*class=["'][^"']*\bTagList__tag\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)]
      .map((tag) => htmlToText(tag[1]))
      .filter(Boolean);

    cards.push({
      title,
      href: eventUrl.toString(),
      groupNames,
      searchText: `${htmlToText(body)} ${groupNames.join(" ")}`,
    });
  }

  return cards;
}

function parseYearRange(value: string) {
  const dates = [...value.matchAll(/\b(20\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/g)];
  if (dates.length === 0) {
    const year = new Date().getFullYear();
    return { startYear: year, endYear: year, startMonth: 1 };
  }
  return {
    startYear: Number(dates[0][1]),
    endYear: Number(dates.at(-1)?.[1] ?? dates[0][1]),
    startMonth: Number(dates[0][2]),
  };
}

function splitVenueAndPrefecture(venueText: string) {
  const prefectureMatch = venueText.match(/\s*[（(]([^（）()]*)[）)]\s*$/);
  return {
    venue: prefectureMatch
      ? venueText.slice(0, prefectureMatch.index).trim()
      : venueText.trim(),
    prefecture: prefectureMatch?.[1]?.trim() || undefined,
  };
}

function parseScheduleRows(
  html: string,
  card: EventCard,
  sourceName: string,
): EventItem[] {
  const pageText = htmlToText(html);
  const title = htmlToText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || card.title;
  const yearRange = parseYearRange(`${card.searchText} ${pageText.slice(0, 8000)}`);
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const events: EventItem[] = [];
  let currentDate: string | null = null;
  let currentVenue = "";
  let currentPrefecture: string | undefined;
  let currentMonth = yearRange.startMonth;
  let currentYear = yearRange.startYear;

  for (const rowMatch of rows) {
    const row = rowMatch[1];
    const dateCell = classContent(row, "row-day");
    const timeCell = classContent(row, "row-time");
    const venueCell = classContent(row, "row-venue");
    if (!dateCell && !timeCell) continue;

    if (dateCell) {
      const dateText = htmlToText(dateCell);
      const dateMatch = dateText.match(/(?:(20\d{2})\s*[./-]\s*)?(\d{1,2})\s*\/\s*(\d{1,2})/);
      if (dateMatch) {
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        if (dateMatch[1]) {
          currentYear = Number(dateMatch[1]);
        } else if (month < currentMonth && yearRange.endYear > currentYear) {
          currentYear = yearRange.endYear;
        }
        currentMonth = month;
        currentDate = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }

    if (venueCell) {
      const venueAnchor = venueCell.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1];
      const location = splitVenueAndPrefecture(htmlToText(venueAnchor ?? venueCell));
      currentVenue = location.venue;
      currentPrefecture = location.prefecture;
    }

    if (!currentDate || !currentVenue) continue;
    const times = [...htmlToText(timeCell).matchAll(/\b\d{1,2}:\d{2}\b/g)].map((time) => time[0]);
    const [openTime, startTime] = times;
    const id = [card.href, currentDate, currentVenue, ...times].join("|");
    events.push({
      id,
      source: sourceName,
      title,
      date: currentDate,
      venue: currentVenue,
      prefecture: currentPrefecture,
      openTime,
      startTime,
      url: card.href,
    });
  }

  return events;
}

function parsePlainTextEvent(
  html: string,
  card: EventCard,
  sourceName: string,
): EventItem[] {
  const pageText = htmlToText(html);
  const title = htmlToText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || card.title;
  const dateMatch = pageText.match(
    /\b(?:EVENT|CONCERT|STAGE|STREAM)\s*(20\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/i,
  );
  if (!dateMatch) return [];
  const date = `${dateMatch[1]}-${String(Number(dateMatch[2])).padStart(2, "0")}-${String(Number(dateMatch[3])).padStart(2, "0")}`;

  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1].match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "",
    text: htmlToText(match[2]),
  }));
  const venueAnchor = anchors.find(({ text }) =>
    /イベントスペース|イベントホール|会場|ホール|アリーナ|ドーム|会館|Zepp|Hall|Studio|店\d+F|大学|メッセ|展示場|体育館|劇場|シアター|センター/i.test(text),
  );
  const location = venueAnchor
    ? splitVenueAndPrefecture(venueAnchor.text)
    : { venue: "会場未記載", prefecture: undefined };

  const showTimes = [...new Set(
    [...pageText.matchAll(/(\d{1,2}:\d{2})\s*(?:開演|開始予定)/g)].map((match) => match[1]),
  )];
  const times = showTimes.length > 0 ? showTimes : [undefined];
  return times.map((startTime) => ({
    id: [card.href, date, location.venue, startTime ?? ""].join("|"),
    source: sourceName,
    title,
    date,
    venue: location.venue,
    prefecture: location.prefecture,
    startTime,
    url: card.href,
  }));
}

async function fetchOfficialPage(url: string) {
  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(12_000),
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "OshigotoMap/1.0 (+official-source-only)",
    },
  });
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}.`);
  return response.text();
}

export async function fetchHelloProjectEvents(
  source: OfficialEventSource,
  profile: { name: string; displayName: string; helpers: string[] },
) {
  const sourceUrl = new URL(source.url);
  if (sourceUrl.hostname !== source.domain) {
    throw new Error("The official event source is not on its configured domain.");
  }

  const homepage = await fetchOfficialPage(sourceUrl.toString());
  const cards = extractEventCards(homepage, source);
  const filtered = filterOfficialGroupEvents(cards, profile);

  const eventLists = await Promise.all(
    filtered.events.map(async (card) => {
      const detail = await fetchOfficialPage(card.href);
      const scheduleRows = parseScheduleRows(detail, card, source.name);
      return scheduleRows.length > 0
        ? scheduleRows
        : parsePlainTextEvent(detail, card, source.name);
    }),
  );

  return {
    mode: filtered.isGroupMode ? "A" as const : "B" as const,
    events: eventLists.flat(),
  };
}
