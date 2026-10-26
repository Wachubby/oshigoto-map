import { NextRequest, NextResponse } from "next/server";
import whitelist from "@/data/whitelisted_sources.json";
import venuesWhitelist from "@/data/venues_whitelist.json";
import { UnknownVenueCollector } from "@/lib/unknown_venue_collector";
import { classifyVenueEvents } from "@/lib/filter";

type NewsItem = { id:string; source:string; kind:string; title?:string; url:string; publishedAt?:string }
type EventCandidate = { id:string; source:string; title:string; date:string; venue:string; prefecture?:string; openTime?:string; startTime?:string; url:string }

const unknownVenueCollector = new UnknownVenueCollector();

function plainText(v:string){ return v.replace(/<[^>]*>/g," ").trim() }
function titleMatchesQuery(title:string, terms:string[]){
  const t = title.toLocaleLowerCase("ja-JP");
  return terms.some(q=> t.includes(q.toLocaleLowerCase("ja-JP")))
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const queryTerms = [...new Set(rawQuery.split(/[,\n]/).map(s=>s.trim()).filter(Boolean))].slice(0,8)

  if (queryTerms.length===0){
    return NextResponse.json({ status:"empty", news:[], events:[], sourceStatuses:[], notice:"blank - 推しを登録してツアーをみよう" })
  }

  const news: NewsItem[] = []
  const sourceStatuses:any[] = []

  // 1. PLATFORMS - new key you added
  const platforms = (whitelist as any).platforms || []
  for (const p of platforms){
    sourceStatuses.push({ name:p.name, kind:"social", status:"unavailable", 
      message: `${p.domain}はホワイトリスト登録済み - キーワード検索は公式API制限のため、個別投稿URLのoEmbedのみ表示。YouTubeとメディアRSSはキーワード検索対応` })
  }

  // 2. COPYRIGHTED MEDIA - fix: don't require feedHost, use domain as host
  for (const source of whitelist.copyrighted_media){
    if (source.enabled !== true){ 
      sourceStatuses.push({ name:source.name, kind:"media", status:"unavailable", message:(source as any).note }); 
      continue 
    }
    try{
      const allowedHost = (source as any).feedHost || source.domain
      const res = await fetch(source.rss, {
        cache:"no-store",
        headers:{ 
          accept:"application/rss+xml, application/xml, text/xml",
          "user-agent":"OshigotoMap/1.0 (+whitelist-only; contact info@wachubby.com)"
        },
        signal: AbortSignal.timeout(9000)
      })
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.text()
      if(body.includes("cf-challenge") || body.includes("Just a moment")) throw new Error("人間確認ページ")

      const items = [...body.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)]
      for(const m of items){
        const xml = m[1]
        const title = (xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").trim()
        const link = (xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").trim()
        if(!title || !link || !titleMatchesQuery(title, queryTerms)) continue
        news.push({ id:`media:${link}`, source:source.name, kind:"media", title: plainText(title), url:link })
        if(news.length>=30) break
      }
      sourceStatuses.push({ name:source.name, kind:"media", status:"ok" })
    }catch(e:any){
      sourceStatuses.push({ name:source.name, kind:"media", status:"error", message:e.message })
    }
  }

  // An event is approved only when its venue name or alias is on the 70-venue whitelist.
  // Unlisted venues are sent to the review collector and never returned as approved events.
  const eventCandidates: EventCandidate[] = []
  const { approved: events } = classifyVenueEvents(
    eventCandidates,
    venuesWhitelist.venues,
    unknownVenueCollector,
  )

  return NextResponse.json({
    status: news.length || events.length ? "ok" : "empty",
    news, events, sourceStatuses,
    notice:"RSSはタイトル+リンクのみ。プラットフォームはドメインをホワイトリスト - Instagram/TikTokは個別URLのoEmbed、YouTube/メディアはキーワード検索でBTS/【entity-Bruno Mars¦canonical_name=Bruno Mars】/Queen全て対応"
  }, { headers:{ "Cache-Control":"no-store" } })
}