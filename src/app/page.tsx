"use client";
import { useState, useMemo } from "react";
import whitelistData from "@/data/Venues-Whitelist.json";
import oshiTypesData from "@/data/Oshi-Genre-Master.json";

type Venue = {
  id: string;
  name: string;
  region: string;
  prefecture: string;
  city: string;
  type: string;
  search_keywords?: string[];
};

export default function Page() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");

  const venues: Venue[] = (whitelistData as any).venues || [];
  const regions = (whitelistData as any).regions || {};
  const oshiTypes = (oshiTypesData as any[]).filter((t:any)=>t.status==="yes");

  const filtered = useMemo(() => {
    return venues.filter((v)=>{
      const matchQ = q==="" || v.name.toLowerCase().includes(q.toLowerCase()) || v.prefecture.toLowerCase().includes(q.toLowerCase()) || (v.search_keywords||[]).some(k=>k.includes(q.toLowerCase()));
      const matchRegion = region==="all" || v.region===region;
      return matchQ && matchRegion;
    });
  },[q,region,venues]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6">
      <header className="max-w-6xl mx-auto flex justify-between mb-6">
        <h1 className="text-2xl font-bold">おしごとマップ <span className="text-xs font-normal text-zinc-400 ml-2">70 venues • threshold 20</span></h1>
      </header>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="会場・都市で検索" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm" />
            <select value={region} onChange={e=>setRegion(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
              <option value="all">全国</option>
              {Object.entries(regions).map(([k,r]:any)=><option key={k} value={k}>{r.label}</option>)}
            </select>
          </div>
          <div className="h- bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
            <div className="text-center"><div className="text-4xl">🗾</div><div className="text-sm text-zinc-300 mt-2">Japan Tour Map - {filtered.length}会場</div></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800 max-h- overflow-auto">
            {filtered.slice(0,100).map(v=><div key={v.id} className="p-3 flex justify-between"><div><div className="text-sm">{v.name}</div><div className="text- text-zinc-500">{v.prefecture} {v.city}</div></div><div className="text- text-zinc-600">{v.region}</div></div>)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-sm font-bold mb-3">登録 → ツアーマップ → カレンダー</h2>
            <div className="grid grid-cols-2 gap-2">
              {oshiTypes.map((t:any)=><div key={t.id} className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-2 py-2"><div className="text-">{t.jp}</div><div className="text- text-zinc-500">{t.en}</div></div>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}