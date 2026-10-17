"use client";
import { useState } from "react";
export default function MapView({oshi}:{oshi:any}){
  const [sel,setSel]=useState<number|null>(null); const [open,setOpen]=useState(false);
  const pins=[
    {id:1,label:"東京 日生劇場",date:"12/3",x:62,y:42,kw:oshi.formal},
    {id:2,label:"名古屋 愛知芸術",date:"12/8",x:55,y:52,kw:oshi.nicknames[0]||oshi.formal},
    {id:3,label:"大阪 フェス",date:"12/12",x:48,y:58,kw:oshi.formal},
    {id:4,label:"広島 HBG",date:"12/15",x:35,y:58,kw:oshi.formal},
    {id:5,label:"福岡 博多座",date:"12/19",x:18,y:72,kw:oshi.formal},
    {id:6,label:"札幌 hitaru",date:"12/22",x:72,y:18,kw:oshi.formal},
  ];
  return (
    <div className="relative h-full">
      <div className="relative h-[62vh] bg-[#f0f0f0] overflow-hidden">
        <img src="/japan-green-base.jpg" alt="Japan" className="w-full h-full object-contain"/>
        <svg className="absolute inset-0 w-full h-full pointer-events-none"><path d="M 62% 42% C 55% 52%,48% 58%,18% 72%" stroke="#FF2D78" strokeWidth="2" strokeDasharray="4 4" fill="none"/><path d="M 18% 72% Q 45% 60% 72% 18%" stroke="#FF2D78" strokeWidth="2" strokeDasharray="4 4" fill="none"/></svg>
        {pins.map(p=><button key={p.id} onClick={()=>setSel(p.id)} style={{left:`${p.x}%`,top:`${p.y}%`}} className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white shadow text-[11px] font-bold flex items-center justify-center ${sel===p.id?"bg-black text-white":"bg-[#FF2D78] text-white"}`}>{p.id}</button>)}
        {sel && <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full animate-bounce">🚅{sel<6?"新幹線":"✈️飛行機"}移動中</div>}
      </div>
      {sel && <div className="absolute bottom-20 left-3 right-3 bg-white rounded-xl shadow-xl p-3 text-sm border"><b>{pins.find(p=>p.id===sel)?.label}</b> <span className="text-xs text-gray-500">{pins.find(p=>p.id===sel)?.date} KW「{pins.find(p=>p.id===sel)?.kw}」</span><button onClick={()=>setSel(null)} className="absolute top-2 right-3">✕</button><div className="text-xs text-gray-400 mt-1">...で「これは違う」学習</div></div>}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow border-t ${open?"h-[55%]":"h-[56px]"}`}><button onClick={()=>setOpen(!open)} className="w-full h-14 flex items-center justify-between px-4"><span className="text-sm font-bold">6件 ↑ ①最速 KW:{oshi.formal}・{oshi.nicknames.join("・")}</span><span>{open?"↓":"↑"}</span></button>{open && <div className="px-4 pb-4 space-y-2 overflow-auto h-[calc(100%-56px)]">{pins.map(p=><div key={p.id} className="border p-2 rounded text-sm flex justify-between"><span>{p.id} {p.label} {p.date}</span><span className="text-xs text-gray-400">{p.kw}</span></div>)}</div>}</div>
    </div>
  );
}
