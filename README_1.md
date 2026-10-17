# 推しマップ MVP - Build Instructions
## Quick Start
1. npm install
2. cp .env.example .env -> fill YOUTUBE_API_KEY
3. npm run dev -> http://localhost:3000

## Features implemented
- Empty-first flow: if no oshi in localStorage, show CTA -> open same 推し管理 sheet (formal + up to 3 nicknames)
- Fixed bottom nav 72px, no scroll
- Map: your green accurate Japan map /public/japan-green-base.jpg, pins ON LAND ①-⑥, Sapporo on Hokkaido land, Shinkansen/Airplane animation, bottom handle swipe
- Calendar: no scroll, dots, popup + 「違う」 learning
- SNS: whitelist only, title+link for media (copyright safe), oEmbed for social, 「違う」 menu -> localStorage block + learning
- Whitelist: data/whitelisted_sources.json
- Terms: /terms with whitelist + keyword + learning + info@wachubby.com

## Map pin % ON LAND
① 東京 62/42 ② 名古屋 55/52 ③ 大阪 48/58 ④ 広島 35/58 ⑤ 福岡 18/72 ⑥ 札幌 72/18 ON HOKKAIDO LAND

## API
src/app/api/whitelist-search/route.ts - RSS proxy (CORS), official methods only
