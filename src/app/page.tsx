"use client";
import { useState, useEffect } from "react";
import MapView from "@/components/MapView";
import CalendarView from "@/components/CalendarView";
import SnsView from "@/components/SnsView";
import OshiRegisterSheet from "@/components/OshiRegisterSheet";
export default function Page(){
  const [tab,setTab]=useState<"calendar"|"map"|"sns"|"menu">("calendar");
  const [oshi,setOshi]=useState<any>(null);
  const [showRegister,setShowRegister]=useState(false);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true); const s=localStorage.getItem("oshi"); if(s) setOshi(JSON.parse(s));},[]);
  const handleSave=(d:any)=>{localStorage.setItem("oshi",JSON.stringify(d)); setOshi(d); setShowRegister(false);};
  if(!mounted) return null;
  const isEmpty=!oshi;
  return (
    <div className="min-h-screen bg-[#f6f6f6] flex justify-center">
      <div className="w-[390px] bg-white min-h-screen relative flex flex-col shadow-xl">
        <header className="h-14 border-b flex items-center justify-between px-4 text-xs"><span className="font-bold">推しごとマップ</span><span className="text-[10px]">ホワイトリスト情報</span></header>
        <div className="flex-1 overflow-hidden relative pb-[72px]">
          {isEmpty ? (
            <div className="p-6 text-center pt-20">
              <h2 className="text-lg font-bold mb-2">推しを登録してツアーをみよう</h2>
              <p className="text-sm text-gray-500 mb-6">正式名 + ニックネーム最大3件でホワイトリスト内を検索</p>
              <button onClick={()=>setShowRegister(true)} className="bg-[#FF2D78] text-white px-6 py-3 rounded-full font-bold">推しを登録する</button>
              <p className="text-[11px] text-gray-400 mt-4">例: 山崎育三郎、いくちゃん、トニー / Mickeyは警告</p>
            </div>
          ):(
            <>
              {tab==="calendar" && <CalendarView oshi={oshi} />}
              {tab==="map" && <MapView oshi={oshi} />}
              {tab==="sns" && <SnsView oshi={oshi} />}
              {tab==="menu" && <div className="p-4 text-sm space-y-4">
                <button onClick={()=>setShowRegister(true)} className="w-full border p-3 rounded-lg text-left">推し管理: {oshi.formal} / {oshi.nicknames.join(", ")} 編集</button>
                <div className="border p-3 rounded-lg">チケット (ここにのみ)</div>
                 <div className="border p-3 rounded-lg"><b>データ提供元 (ホワイトリスト)</b><p className="text-xs text-gray-500 mt-2">公式サイトと利用可能なRSSを検索します。メディアはタイトルとリンクのみ表示します。Instagram投稿は公開検索APIを利用できないため取得しません。利用できない情報源は検索結果として表示しません。</p></div>
                <a href="/terms" className="underline">利用規約</a>
              </div>}
            </>
          )}
        </div>
        <nav className="absolute bottom-0 left-0 right-0 h-[72px] bg-white border-t flex z-50">
          {[["calendar","カレンダー"],["map","マップ"],["sns","SNS"],["menu","メニュー"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k as any)} className={`flex-1 flex flex-col items-center justify-center text-[11px] ${tab===k?"text-[#FF2D78] font-bold":"text-gray-400"}`}><span className="text-lg">{k==="calendar"?"📅":k==="map"?"🗾":k==="sns"?"💖":"☰"}</span>{l}</button>
          ))}
        </nav>
        {showRegister && <OshiRegisterSheet initial={oshi} onSave={handleSave} onClose={()=>setShowRegister(false)} />}
      </div>
    </div>
  );
}
