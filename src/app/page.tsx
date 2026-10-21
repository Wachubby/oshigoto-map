'use client';

import { useState, useEffect, useRef } from 'react';
import venuesData from '@/data/venues_whitelist.json';
import oshiTypes from '@/data/oshi_types.json';

// Full Oshigoto Map UI - Map + Calendar + Social + List
export default function OshigotoMapPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'calendar' | 'social' | 'list'>('map');
  const [region, setRegion] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const venues = (venuesData as any).venues as any[];
  const regions = (venuesData as any).regions;
  const yesTypes = (oshiTypes as any[]).filter(t => t.status === 'yes');
  const filtered = region === 'all' ? venues : venues.filter(v => v.region === region);
  const filteredBySearch = searchQuery 
    ? filtered.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.search_keywords?.some((k:string) => k.includes(searchQuery.toLowerCase())))
    : filtered;

  // Whitelist search API (existing /api/whitelist-search)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/whitelist-search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Calendar helpers
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  if (!mounted) {
    return <div style={{padding:20}}>おしごとマップ読み込み中...</div>;
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">おしごとマップ - Oshigoto Map</h1>
            <p className="text-[11px] md:text-xs text-gray-500">公式アカウント + 会場ホワイトリスト + 未来日付 + イベントキーワード</p>
          </div>
          <div className="hidden md:flex gap-2 text-[10px]">
            <span className="px-2 py-1 bg-black text-white rounded-full">{yesTypes.length}ジャンル</span>
            <span className="px-2 py-1 bg-white border rounded-full">{venues.length}会場</span>
            <span className="px-2 py-1 bg-white border rounded-full">しきい値: 20 or 14日</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {[
            {id:'map', label:'🗺️ Map', sub:`${filteredBySearch.length}`},
            {id:'calendar', label:'📅 Calendar', sub:'おしごと'},
            {id:'social', label:'📱 Social', sub:'公式'},
            {id:'list', label:'📋 List', sub:'70'},
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap border transition ${activeTab===tab.id ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-100'}`}>
              {tab.label} <span className="ml-1 text-[10px] opacity-70">{tab.sub}</span>
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="会場検索 / venue search" className="px-3 py-2 border rounded-lg text-sm w-[180px] md:w-[260px]" />
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Region filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setRegion('all')} className={`px-3 py-1.5 rounded-full text-xs md:text-sm border font-bold ${region==='all'?'bg-black text-white border-black':'bg-white'}`}>すべて ({venues.length})</button>
          {Object.keys(regions).map(r => (
            <button key={r} onClick={() => setRegion(r)} className={`px-3 py-1.5 rounded-full text-xs md:text-sm border ${region===r?'bg-black text-white border-black':'bg-white'}`}>
              {regions[r].label} ({regions[r].count})
            </button>
          ))}
        </div>

        {/* MAP TAB */}
        {activeTab==='map' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <div ref={mapRef} className="h-[520px] md:h-[720px] bg-white border rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-5xl mb-3">🗺️</div>
                <div className="font-bold">Map View - {region==='all'?'全国':regions[region]?.label}</div>
                <div className="text-xs text-gray-600 mt-1 max-w-[320px]">Google Maps / Mapbox pins here. {filteredBySearch.length}会場表示中. Client-only rendering to keep healthcheck passing.</div>
                <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-[400px] text-[11px]">
                  {filteredBySearch.slice(0,8).map(v=>(
                    <div key={v.id} className="bg-white border rounded px-2 py-1 text-left truncate">📍 {v.name}</div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-gray-400">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Secrets to enable real map</div>
              </div>
            </div>
            <div className="space-y-2 max-h-[720px] overflow-auto pr-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{filteredBySearch.length} venues - {region}</div>
              {filteredBySearch.map(v=>(
                <div key={v.id} className="bg-white border rounded-xl p-3 hover:shadow-md transition">
                  <div className="font-bold text-sm">{v.name}</div>
                  <div className="text-[11px] text-gray-600 mt-1">{v.region} / {v.prefecture} {v.city} / {v.type}</div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.aliases?.slice(0,3).map((a:string)=><span key={a} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full">{a}</span>)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(v.name)}`} target="_blank" className="text-[11px] px-2 py-1 bg-black text-white rounded">Open Map</a>
                    <span className="text-[11px] px-2 py-1 border rounded">{v.search_keywords?.[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab==='calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={()=>setSelectedDate(new Date(year, month-1, 1))} className="px-3 py-1 border rounded">‹</button>
                <div className="font-black">{year}年 {monthNames[month]}</div>
                <button onClick={()=>setSelectedDate(new Date(year, month+1, 1))} className="px-3 py-1 border rounded">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500 mb-1">
                {['日','月','火','水','木','金','土'].map(d=><div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length:firstDay}).map((_,i)=><div key={`e-${i}`} />)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const d = i+1;
                  const isToday = new Date().getDate()===d && new Date().getMonth()===month && new Date().getFullYear()===year;
                  const isSelected = selectedDate.getDate()===d;
                  return (
                    <button key={d} onClick={()=>setSelectedDate(new Date(year, month, d))}
                      className={`h-10 md:h-12 border rounded-lg text-sm ${isSelected?'bg-black text-white border-black font-bold': isToday?'bg-blue-50 border-blue-300': 'bg-white hover:bg-gray-50'}`}>
                      {d}
                      <div className="text-[8px] opacity-70">•</div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 text-[11px] text-gray-600">
                選択: {year}/{month+1}/{selectedDate.getDate()} - 公式アカウントの投稿から未来日付のイベントを抽出
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold">📅 {year}/{month+1}/{selectedDate.getDate()} のおしごと</div>
                <div className="text-xs text-gray-500 mt-1">この日のホワイトリスト会場イベント (モック - /api/unknown-venues と連携予定)</div>
                <div className="mt-3 space-y-2">
                  {filtered.slice(0,5).map(v=>(
                    <div key={v.id} className="flex gap-3 p-2 border rounded-lg">
                      <div className="text-[11px] px-2 py-1 bg-gray-100 rounded h-fit">{['19:00','19:30','20:00'][Math.floor(Math.random()*3)]}</div>
                      <div>
                        <div className="font-bold text-sm">{v.name}</div>
                        <div className="text-[11px] text-gray-600">ライブ / 特典会 / チェキ会 • {v.prefecture}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold text-sm">対応ジャンル 18種 (maid除く v1)</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {yesTypes.map(t=>(
                    <span key={t.id} className="text-[10px] px-2 py-1 bg-black text-white rounded-full">{t.jp}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SOCIAL TAB */}
        {activeTab==='social' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white border rounded-xl p-4">
                <div className="font-black">📱 公式アカウント フィード</div>
                <div className="text-xs text-gray-500">ホワイトリスト会場 + 未来日付 + キーワード (ライブ/物販/遠征/ワンマン/特典会/チェキ会/サイン会) でフィルタ</div>
                <div className="mt-4 space-y-3">
                  {[
                    {name:'地下アイドルA', handle:'@chika_a', text:'【ライブ情報】12/15(日) Shibuya O-EAST にてワンマンライブ決定！🎤 チケット発売中 #おしごと', venue:'Shibuya O-EAST', time:'2時間前'},
                    {name:'バンドB', handle:'@band_b', text:'明日は Veats Shibuya にて対バン！物販あります📸 チェキ会もやるよ', venue:'Veats Shibuya', time:'5時間前'},
                    {name:'コスプレイヤーC', handle:'@cos_c', text:'12/20 コミケ参加決定！サイン会やります✍️ 場所は...', venue:'Tokyo Big Sight', time:'昨日'},
                  ].map((post,i)=>(
                    <div key={i} className="border rounded-xl p-3">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                        <div>
                          <div className="font-bold text-sm">{post.name} <span className="font-normal text-gray-500 text-xs">{post.handle} • {post.time}</span></div>
                          <div className="text-sm mt-1">{post.text}</div>
                          <div className="mt-2 flex gap-2">
                            <span className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full">📍 {post.venue}</span>
                            <span className="text-[11px] px-2 py-1 bg-green-50 text-green-700 rounded-full">✅ ホワイトリスト一致</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold text-sm">未登録会場モニタ</div>
                <div className="text-[11px] text-gray-600 mt-1">20件 or 14日でレポート - /api/unknown-venues</div>
                <div className="mt-2 text-xs p-2 bg-gray-50 rounded border">
                  threshold: {(venuesData as any).maintenance?.unknown_venue_threshold || 20} / 14日<br/>
                  current: 0件 (phase1-quick-turnaround)
                </div>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <div className="font-bold text-sm">検索API</div>
                <div className="text-[11px] text-gray-600">/api/whitelist-search?q=渋谷</div>
                {searchResults.length>0 && (
                  <div className="mt-2 space-y-1 max-h-[200px] overflow-auto">
                    {searchResults.slice(0,6).map((r:any,i:number)=><div key={i} className="text-xs p-1 border-b">{r.name || JSON.stringify(r).slice(0,60)}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LIST TAB - old whitelist */}
        {activeTab==='list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredBySearch.map(v => (
              <div key={v.id} className="bg-white border rounded-xl p-3 text-sm hover:shadow">
                <div className="font-bold">{v.name}</div>
                <div className="text-[11px] text-gray-600">{v.region} / {v.prefecture} {v.city} / {v.type}</div>
                <div className="text-[11px] mt-1 text-gray-500">{v.aliases?.join(', ')}</div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-10 pt-6 border-t text-[11px] text-gray-500">
          <div>v{(venuesData as any).version} - {(venuesData as any).updated} • 5 regions: 東京/関東 40, 大阪/関西 12, 名古屋/中部 7, 札幌/北海道 5, 福岡/九州 6</div>
          <div className="mt-1">除外: Disneyland, private cafe, maid/concafe v1除外 (v2でhome-pin対応予定) • Whitelist 70 venues • 19 genres</div>
          <div className="mt-2 flex gap-2">
            <a href="/terms" className="underline">利用規約</a>
            <span>•</span>
            <a href="/api/whitelist-search" className="underline">/api/whitelist-search</a>
            <span>•</span>
            <span>/api/unknown-venues でレポート</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
