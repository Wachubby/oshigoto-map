"use client";
import { useState } from "react";
const GENERIC=["mickey","ミッキー","ちゃん","くん"];
export default function Sheet({initial,onSave,onClose}:{initial:any,onSave:any,onClose:any}){
  const [formal,setFormal]=useState(initial?.formal||"山崎育三郎");
  const [yomi,setYomi]=useState(initial?.yomi||"やまざきいくさぶろう");
  const [nick,setNick]=useState(""); const [nicks,setNicks]=useState<string[]>(initial?.nicknames||["いくちゃん","トニー"]);
  const isGen=(s:string)=>GENERIC.some(g=>s.toLowerCase().includes(g.toLowerCase()));
  const gen=nicks.find(isGen);
  return (
    <div className="absolute inset-0 bg-black/40 z-[60] flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-auto">
        <div className="flex justify-between mb-4"><b>推しを登録</b><button onClick={onClose}>✕</button></div>
        <label className="text-xs">正式名 必須</label><input value={formal} onChange={e=>setFormal(e.target.value)} className="w-full border p-2 rounded mb-3"/>
        <label className="text-xs">読み</label><input value={yomi} onChange={e=>setYomi(e.target.value)} className="w-full border p-2 rounded mb-3"/>
        <label className="text-xs">ニックネーム 最大3件</label>
        <div className="flex gap-2 mb-2"><input value={nick} onChange={e=>setNick(e.target.value)} placeholder="いくちゃん" className="flex-1 border p-2 rounded"/><button onClick={()=>{if(nick&&nicks.length<3){setNicks([...nicks,nick]); setNick("");}}} className="bg-black text-white px-3 rounded">追加</button></div>
        <div className="flex gap-2 flex-wrap mb-3">{nicks.map((n,i)=><span key={i} className="bg-pink-100 text-[#FF2D78] px-2 py-1 rounded-full text-xs">{n} <button onClick={()=>setNicks(nicks.filter((_,j)=>j!==i))}>x</button></span>)}</div>
        {gen && <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs mb-3">⚠️「{gen}」は一般的すぎます。別人の情報が混ざる可能性があります。</div>}
        <div className="bg-gray-50 p-2 rounded text-xs mb-4">登録後、ホワイトリスト内で正式名とニックネームを検索します。</div>
        <p className="text-[11px] text-gray-400 mb-3">端末内(LocalStorage)のみ保存</p>
        <button onClick={()=>onSave({formal,yomi,nicknames:nicks})} className="w-full bg-[#FF2D78] text-white py-3 rounded-full font-bold">登録</button>
      </div>
    </div>
  );
}
