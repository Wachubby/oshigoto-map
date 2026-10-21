'use client';

import { useState, useEffect } from 'react';
import venuesData from '@/data/venues_whitelist.json';
import oshiTypes from '@/data/oshi_types.json';

// Healthcheck-safe: no window/document access on server, no heavy lib imports
export default function OshigotoMapPage() {
  const [region, setRegion] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const venues = (venuesData as any).venues as any[];
  const filtered = region === 'all' ? venues : venues.filter(v => v.region === region);
  
  const regions = (venuesData as any).regions;
  const yesTypes = (oshiTypes as any[]).filter(t => t.status === 'yes');

  if (!mounted) {
    // Return minimal HTML for healthcheck / SSR - prevents 500
    return <div style={{padding: 20}}>おしごとマップ読み込み中...</div>;
  }

  return (
    <main className="min-h-screen bg-white text-black p-4 max-w-6xl mx-auto">
      <header className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">おしごとマップ - Oshigoto Map</h1>
        <p className="text-sm text-gray-600">公式アカウント + 会場ホワイトリスト + 未来日付 + イベントキーワード</p>
        <div className="mt-2 text-xs">
          対応: {yesTypes.length}ジャンル / 会場 {venues.length}件 / 
          しきい値: {(venuesData as any).maintenance.unknown_venue_threshold}件 or 14日
        </div>
      </header>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setRegion('all')} className={`px-3 py-1 rounded border ${region==='all'?'bg-black text-white':''}`}>すべて ({venues.length})</button>
        {Object.keys(regions).map(r => (
          <button key={r} onClick={() => setRegion(r)} className={`px-3 py-1 rounded border ${region===r?'bg-black text-white':''}`}>
            {regions[r].label} ({regions[r].count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(v => (
          <div key={v.id} className="border rounded p-3 text-sm">
            <div className="font-bold">{v.name}</div>
            <div className="text-xs text-gray-600">{v.region} / {v.prefecture} {v.city} / {v.type}</div>
            <div className="text-xs mt-1">{v.aliases?.join(', ')}</div>
          </div>
        ))}
      </div>

      <footer className="mt-8 pt-4 border-t text-xs text-gray-500">
        <div>v{(venuesData as any).version} - {(venuesData as any).updated}</div>
        <div>Whitelist: 5 regions, Disneyland / private cafe 除外, 19 genres (maid除外v1)</div>
        <div className="mt-2">/api/unknown-venues で未登録会場レポート確認</div>
      </footer>
    </main>
  );
}
