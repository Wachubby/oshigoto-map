"use client";
import { useState } from "react";
export default function SnsView({oshi}:{oshi:any}){
  const [items,setItems]=useState([
    {id:1,source:"公式Instagram",text:"本日リハ！",kw:oshi.formal,type:"official"},
    {id:2,source:"関連公式: 安倍なつみ",text:"夫の育三郎が...",kw:"育三郎",type:"related",badge:"関連"},
    {id:3,source:"正規メディア: ORICON",text:"山崎育三郎、ミュージカル",kw:oshi.formal,type:"media",link:"oricon"},
    {id:4,source:"正規メディア: ナタリー",text:"全国ツアー発表",kw:oshi.nicknames[0]||oshi.formal,type:"media"},
  ]);
  const [menu,setMenu]=useState<number|null>(null);
  const hide=(id:number,reason:string)=>{setItems(items.filter(i=>i.id!==id)); alert(reason+": 非表示、学習します");};
  return (<div className="p-3 space-y-3"><div className="text-[11px] bg-gray-50 p-2 rounded">ホワイトリスト内のみ: 公式 + 関連(安倍なつみ) + 正規メディア タイトル+リンクのみ</div>{items.map(it=><div key={it.id} className="border rounded-lg p-3 text-sm relative"><div className="flex justify-between"><span className="font-bold text-xs">{it.source} {it.badge&&<span className="bg-yellow-100 text-[10px] px-1 rounded">{it.badge}</span>}</span><button onClick={()=>setMenu(menu===it.id?null:it.id)}>...</button></div><p className="mt-1">{it.text}</p><p className="text-[11px] text-gray-400">KW「{it.kw}」{it.link&&" / リンクのみ"}</p>{menu===it.id && <div className="absolute right-2 top-8 bg-white border shadow rounded p-2 text-xs z-10"><button onClick={()=>hide(it.id,"これは違う")} className="block">これは違う推しの情報です</button><button onClick={()=>hide(it.id,`KW「${it.kw}」除外`)} className="block">このキーワード「{it.kw}」を除外</button><button onClick={()=>hide(it.id,`提供元 ${it.source} ミュート`)} className="block">提供元をミュート</button></div>}</div>)}</div>);
}
