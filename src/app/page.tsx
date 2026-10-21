'use client';

import { useState, useEffect } from 'react';
import venuesData from '@/data/venues_whitelist.json';
import oshiTypes from '@/data/oshi_types.json';

type SpotType = 'oshigoto' | 'livehouse' | 'cafe' | 'shop';
type Tab = 'map' | 'list' | 'fav' | 'mypage';

interface Spot {
  id: string;
  name: string;
  type: SpotType;
  lat: number; // % top
  lng: number; // % left
  ward: string;
}

const MOCK_SPOTS: Spot[] = [
  { id: '1', name: 'Veats Shibuya', type: 'oshigoto', lat: 42, lng: 38, ward: '渋谷区' },
  { id: '2', name: 'Shibuya O-EAST', type: 'livehouse', lat: 32, lng: 52, ward: '渋谷区' },
  { id: '3', name: 'LIQUIDROOM', type: 'oshigoto', lat: 68, lng: 58, ward: '港区' },
  { id: '4', name: 'Shibuya Stream Hall', type: 'cafe', lat: 18, lng: 46, ward: '新宿区' },
  { id: '5', name: 'Akihabara P.A.R.M.S', type: 'shop', lat: 26, lng: 74, ward: '千代田区' },
  { id: '6', name: 'TwinBox AKIHA', type: 'cafe', lat: 60, lng: 18, ward: '目黒区' },
  { id: '7', name: 'Shinjuku BLAZE', type: 'shop', lat: 70, lng: 76, ward: '中央区' },
  { id: '8', name: 'Zepp DiverCity', type: 'livehouse', lat: 15, lng: 50, ward: '港区' },
];

export default function OshigotoMapOriginal() {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [activeFilter, setActiveFilter] = useState<SpotType | 'all'>('oshigoto');
  const [oshiKeywords, setOshiKeywords] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const onboarded = localStorage.getItem('oshi-onboarded');
    if (!onboarded) setShowOnboarding(true);
    const savedKeywords = localStorage.getItem('oshi-keywords');
    if (savedKeywords) setOshiKeywords(savedKeywords);
  }, []);

  useEffect(() => {
    if (oshiKeywords) localStorage.setItem('oshi-keywords', oshiKeywords);
  }, [oshiKeywords]);

  const venues = (venuesData as any).venues as any[];
  const yesTypes = (oshiTypes as any[]).filter((t:any) => t.status === 'yes');

  const filteredSpots = activeFilter === 'all' ? MOCK_SPOTS : MOCK_SPOTS.filter(s => s.type === activeFilter);
  const displaySpots = searchQuery ? filteredSpots.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) : filteredSpots;

  if (!mounted) return <div style={{padding:20, fontFamily:'sans-serif'}}>推しごとマップ読み込み中...</div>;

  // Onboarding - matches your video: green Japan map + pink pins
  if (showOnboarding) {
    const steps = [
      { title: '推しを登録', sub: '好きなアーティストをひとつ', img: '🩷', desc: '推しごとマップ\n推しと、次楽しみへ。' },
      { title: '日本のツアーをイメージ', sub: '行った場所、見かけよう', img: '🗺️', desc: '推しごとマップ\n推しと、次楽しみへ。' },
      { title: '予定と最新情報をチェック', sub: 'カレンダーとニュースをひと目で', img: '📅', desc: '推しごとマップ\n推しと、次楽しみへ。' },
    ];
    const step = steps[onboardStep];
    return (
      <div className="min-h-screen bg-[#fff7fb] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-[380px] w-full">
          <h1 className="text-[22px] font-black tracking-tight">推しごとマップ</h1>
          <p className="text-[12px] text-gray-600 mt-1">推しと、次楽しみへ。</p>
          <div className="mt-2 inline-block px-3 py-1 bg-[#ffd6e8] text-[11px] rounded-full font-bold">コンセプトムービー</div>
          
          <div className="mt-8 h-[380px] bg-white rounded-[24px] border shadow-sm relative overflow-hidden flex items-center justify-center">
            {/* Green Japan Map - original green base you had */}
            <div className="relative w-[240px] h-[320px]">
              <div className="absolute inset-0 bg-[#c8e6c9] rounded-[20px]" style={{clipPath:'polygon(20% 0%, 80% 5%, 85% 20%, 75% 35%, 80% 60%, 70% 85%, 40% 90%, 15% 75%, 10% 40%)'}} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[60px]">🗾</div>
              </div>
              {/* Pins */}
              {onboardStep === 0 && <div className="absolute left-[30%] bottom-[20%] text-[32px]">📍</div>}
              {onboardStep === 1 && (
                <>
                  <div className="absolute left-[20%] bottom-[15%] text-[36px]">📍</div>
                  <div className="absolute left-[50%] top-[40%] text-[36px]">📍</div>
                  <div className="absolute left-[75%] top-[5%] text-[36px]">📍</div>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex:0}}>
                    <path d="M 60 250 Q 120 200 150 130" stroke="#ff2d78" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                    <path d="M 150 130 Q 190 70 220 30" stroke="#ff2d78" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                  </svg>
                </>
              )}
              {onboardStep >= 2 && (
                <>
                  <div className="absolute left-[20%] bottom-[15%] text-[36px]">📍</div>
                  <div className="absolute left-[50%] top-[40%] text-[36px]">📍</div>
                  <div className="absolute left-[75%] top-[5%] text-[36px]">📍</div>
                </>
              )}
            </div>
            {onboardStep >= 1 && onboardStep <= 2 && (
              <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gray-200 rounded">
                <div className="h-full bg-[#ff2d78] rounded" style={{width: onboardStep===1 ? '50%' : '80%'}} />
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="font-bold text-[16px]">{step.title}</h2>
            <p className="text-[12px] text-gray-600 mt-1">{step.sub}</p>
            <p className="text-[9px] text-gray-400 mt-6 leading-[1.4]">開発中の画面イメージ<br/>実際の画像・公式情報ではありません</p>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {[0,1,2].map(i => (
              <div key={i} className={`h-[3px] rounded-full transition-all ${i===onboardStep ? 'w-[32px] bg-[#ff2d78]' : 'w-[24px] bg-gray-200'}`} />
            ))}
          </div>

          <button onClick={() => {
            if (onboardStep < 2) setOnboardStep(onboardStep+1);
            else { localStorage.setItem('oshi-onboarded','true'); setShowOnboarding(false); }
          }} className="mt-6 w-full py-[14px] bg-black text-white rounded-full font-bold text-[14px]">
            {onboardStep < 2 ? '次へ' : '推しを登録してはじめる'}
          </button>
          {onboardStep > 0 && (
            <button onClick={() => setOnboardStep(onboardStep-1)} className="mt-2 text-[12px] text-gray-500">戻る</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col max-w-[480px] mx-auto md:max-w-[1400px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
      {/* Header - matches screenshot: 推しごとマップ oshigoto-map */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 border-b">
        <button className="p-2 -ml-2">☰</button>
        <div className="text-center">
          <h1 className="text-[24px] md:text-[28px] font-black tracking-tight leading-none">推しごとマップ</h1>
          <p className="text-[12px] text-gray-500 tracking-widest">oshigoto-map</p>
        </div>
        <button className="p-2 -mr-2 text-[20px]">🔍</button>
      </header>

      {activeTab === 'map' && (
        <>
          {/* Filters - おしごと活動 / ライブハウス / カフェ / ショップ */}
          <div className="bg-white px-3 py-3 flex gap-2 overflow-x-auto border-b">
            {[
              { id: 'oshigoto', label: 'おしごと活動', icon: '💖', color: 'bg-[#ffe4ec] border-[#ff2d78] text-[#ff2d78]' },
              { id: 'livehouse', label: 'ライブハウス', icon: '🎵', color: 'bg-gray-100' },
              { id: 'cafe', label: 'カフェ', icon: '☕', color: 'bg-gray-100' },
              { id: 'shop', label: 'ショップ', icon: '🛍️', color: 'bg-gray-100' },
            ].map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id as any)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap border flex items-center gap-1 transition ${activeFilter===f.id ? f.color + ' border' : 'bg-[#f0f0f0] border-transparent text-gray-700'}`}>
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Map - Tokyo centered like your screenshot */}
          <div className="flex-1 relative bg-[#eef2f5] h-[calc(100vh-180px)] md:h-[640px] overflow-hidden">
            {/* Street grid */}
            <div className="absolute inset-0 opacity-[0.08]" style={{backgroundImage:`linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize:'40px 40px'}} />
            
            {/* Wards labels - like screenshot */}
            <div className="absolute top-[18%] left-[12%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">新宿区</div>
            <div className="absolute top-[22%] right-[12%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">千代田区</div>
            <div className="absolute top-[38%] left-[28%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">渋谷区</div>
            <div className="absolute top-[36%] right-[34%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">港区</div>
            <div className="absolute top-[44%] left-[52%] text-[11px] bg-white/60 px-1 rounded">原宿</div>
            <div className="absolute top-[52%] left-[48%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">原宿</div>
            <div className="absolute top-[54%] right-[16%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">中央区</div>
            <div className="absolute top-[72%] left-[6%] text-[12px] font-bold bg-white/80 px-2 py-1 rounded">目黒区</div>
            <div className="absolute bottom-[20%] left-[40%] text-[10px] text-gray-500">国道246号</div>
            <div className="absolute bottom-[18%] right-[16%] text-[9px] text-gray-400">明治神宮外苑</div>

            {/* Pins */}
            {displaySpots.map(spot => {
              const colors: Record<SpotType, string> = {
                oshigoto: 'bg-[#ff4d8d] text-white',
                livehouse: 'bg-[#7c6cff] text-white',
                cafe: 'bg-[#c67a2b] text-white',
                shop: 'bg-[#4caf82] text-white',
              };
              const icons: Record<SpotType, string> = {
                oshigoto: '💖',
                livehouse: '🎵',
                cafe: '☕',
                shop: '🛍️',
              };
              return (
                <div key={spot.id} className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group" style={{left:`${spot.lng}%`, top:`${spot.lat}%`}}>
                  <div className={`w-[36px] h-[36px] rounded-full rounded-br-[2px] rotate-[-45deg] flex items-center justify-center shadow-lg ${colors[spot.type]} group-hover:scale-110 transition`}>
                    <span className="rotate-[45deg] text-[16px]">{icons[spot.type]}</span>
                  </div>
                  <div className="absolute top-[36px] left-1/2 -translate-x-1/2 bg-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {spot.name}
                  </div>
                </div>
              );
            })}

            {/* Current location blue dot */}
            <div className="absolute left-[48%] top-[58%] w-[24px] h-[24px] bg-[#3b82f6] rounded-full border-[4px] border-white shadow-lg flex items-center justify-center">
              <div className="w-[8px] h-[8px] bg-white rounded-full" />
              <div className="absolute w-[32px] h-[32px] bg-blue-400/30 rounded-full animate-ping" />
            </div>

            {/* Zoom buttons */}
            <div className="absolute right-4 bottom-[100px] flex flex-col gap-2">
              <button className="w-[48px] h-[48px] bg-white rounded-full shadow-lg flex items-center justify-center text-[24px] font-light">+</button>
              <button className="w-[48px] h-[48px] bg-white rounded-full shadow-lg flex items-center justify-center text-[24px] font-light">−</button>
            </div>

            {/* Scale */}
            <div className="absolute left-3 bottom-[88px] bg-white/90 px-3 py-1 rounded-lg text-[11px] shadow">
              <div className="w-[60px] h-[2px] bg-black mb-1" />
              500m
            </div>

            {/* Bottom sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[16px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 flex items-center justify-between">
              <div className="text-[13px] font-bold">表示中：{displaySpots.length}件のスポット</div>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-[8px] h-[8px] rounded-full bg-[#ff4d8d]" />おしごと</span>
                <span className="flex items-center gap-1"><span className="w-[8px] h-[8px] rounded-full bg-[#7c6cff]" />ライブハウス</span>
                <span className="flex items-center gap-1"><span className="w-[8px] h-[8px] rounded-full bg-[#c67a2b]" />カフェ</span>
                <span className="flex items-center gap-1"><span className="w-[8px] h-[8px] rounded-full bg-[#4caf82]" />ショップ</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'list' && (
        <div className="p-4 space-y-2">
          <div className="text-[12px] text-gray-500 mb-2">対応: {yesTypes.length}ジャンル / {venues.length}会場 / しきい値: 20 or 14日</div>
          {venues.slice(0,20).map((v:any) => (
            <div key={v.id} className="bg-white p-3 rounded-xl border flex justify-between">
              <div>
                <div className="font-bold text-[13px]">{v.name}</div>
                <div className="text-[11px] text-gray-500">{v.region} / {v.prefecture} / {v.type}</div>
              </div>
              <span className="text-[10px] px-2 py-1 bg-[#ffe4ec] text-[#ff2d78] rounded-full h-fit">{v.search_keywords?.[0] || 'ライブ'}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'fav' && (
        <div className="p-6 text-center">
          <div className="text-[48px]">💖</div>
          <div className="font-bold mt-2">お気に入り</div>
          <div className="text-[12px] text-gray-500 mt-1">お気に入りの推しごとスポットがここに表示されます</div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {MOCK_SPOTS.slice(0,4).map(s => (
              <div key={s.id} className="bg-white p-3 rounded-xl border text-left">
                <div className="font-bold text-[12px]">{s.name}</div>
                <div className="text-[10px] text-gray-500">{s.ward}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mypage' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-[16px] p-5 border">
            <h2 className="font-black text-[16px]">推しごとマップ</h2>
            <p className="text-[12px] text-gray-600 mt-1">ブラウザにローカル保存する推しの活動登録</p>
            
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[14px]">推しキーワード (oshi-keywords)</h3>
                <span className="w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[10px]">i</span>
              </div>
              <div className="mt-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">✨</span>
                <input value={oshiKeywords} onChange={e=>setOshiKeywords(e.target.value)}
                  placeholder="oshi-keywords（例: 担当, 現場, 物販, 遠征...）"
                  className="w-full pl-9 pr-4 py-3 bg-[#f8f8f8] border rounded-[10px] text-[13px]" />
              </div>
              <p className="text-[11px] text-gray-500 mt-3 flex gap-2">
                <span className="w-[16px] h-[16px] rounded-full border flex items-center justify-center text-[9px]">i</span>
                入力はブラウザの localStorage に保存されます。<br/>デバイスのみに保存・外部送信なし
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-5 border border-dashed">
            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] bg-gradient-to-br from-pink-200 to-purple-200 rounded-[10px] flex items-center justify-center">📅</div>
              <div>
                <h3 className="font-bold">カレンダー表示</h3>
                <p className="text-[13px] mt-1">予定はまだありません ー</p>
                <p className="text-[12px] text-gray-500">登録すると日付ごとに表示されます</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-5 border border-dashed">
            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">📍</div>
              <div>
                <h3 className="font-bold">マップ表示</h3>
                <p className="text-[13px] mt-1">マップはまだ空です ー</p>
                <p className="text-[12px] text-gray-500">推し活スポットがここに表示されます</p>
              </div>
            </div>
          </div>

          <div className="bg-[#fff7fb] rounded-[16px] p-4 border border-pink-100">
            <div className="text-[11px] text-gray-600">対応ジャンル {yesTypes.length}種 • 会場 {venues.length}件 • ホワイトリスト + 公式 + 未来日付 + キーワード</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {yesTypes.slice(0,8).map((t:any) => (
                <span key={t.id} className="text-[9px] px-2 py-1 bg-white border rounded-full">{t.jp}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - like screenshot */}
      <nav className="bg-white border-t flex justify-around py-2 sticky bottom-0 z-20">
        {[
          { id:'map', label:'マップ', icon:'📍' },
          { id:'list', label:'一覧', icon:'☰' },
          { id:'fav', label:'お気に入り', icon:'♡' },
          { id:'mypage', label:'マイページ', icon:'👤' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex flex-col items-center px-4 py-1 ${activeTab===tab.id ? 'text-[#ff2d78]' : 'text-gray-400'}`}>
            <span className="text-[22px]">{tab.icon}</span>
            <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
