"use client"
import { useEffect, useState } from "react"

type Oshi = {
  formal: string
  nicks: string[]
}

export default function Home() {
  const [oshi, setOshi] = useState<Oshi | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [formal, setFormal] = useState("")
  const [nicks, setNicks] = useState(["", "", ""])

  // Load from localStorage - stays after server restart, only cleared if user clears cache
  useEffect(() => {
    const saved = localStorage.getItem("oshi-keywords")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOshi(parsed)
        setFormal(parsed.formal || "")
        setNicks([...(parsed.nicks || []), "", "", ""].slice(0, 3))
      } catch {}
    }
  }, [])

  const isEmpty = !oshi?.formal

  const openSettings = () => setShowSheet(true)

  const save = () => {
    const trimmedFormal = formal.trim()
    if (!trimmedFormal) return
    const data: Oshi = {
      formal: trimmedFormal,
      nicks: nicks.map(n => n.trim()).filter(Boolean).slice(0, 3)
    }
    localStorage.setItem("oshi-keywords", JSON.stringify(data))
    setOshi(data)
    setShowSheet(false)
  }

  const clear = () => {
    localStorage.removeItem("oshi-keywords")
    setOshi(null)
    setFormal("")
    setNicks(["", "", ""])
    setShowSheet(false)
  }

  return (
    <div style={{minHeight:"100dvh", background:"white", color:"black", display:"flex", flexDirection:"column", fontFamily:"-apple-system, BlinkMacSystemFont, sans-serif"}}>
      {/* Header - always tappable */}
      <header style={{padding:"16px 20px", borderBottom:"1px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"white", zIndex:10}} onClick={openSettings}>
        <div style={{fontWeight:700, fontSize:18, cursor:"pointer"}}>
          {oshi?.formal ? `推し: ${oshi.formal}` : "推しごとマップ"}
        </div>
        <div style={{fontSize:12, color:"#888", border:"1px solid #ddd", borderRadius:20, padding:"6px 12px", cursor:"pointer"}}>
          {oshi?.formal ? "変更" : "登録"}
        </div>
      </header>

      {/* Main - blank when empty, tap anywhere opens settings */}
      <main style={{flex:1, padding:"16px", display:"flex", flexDirection:"column", gap:16}} onClick={isEmpty ? openSettings : undefined}>
        
        {/* Calendar */}
        <div style={{background:"#f8f8f8", borderRadius:16, padding:16, minHeight:260, cursor: isEmpty ? "pointer" : "default"}}>
          <div style={{fontSize:13, fontWeight:600, color:"#888", marginBottom:12}}>カレンダー</div>
          {isEmpty ? (
            <div style={{height:180, display:"grid", placeItems:"center", textAlign:"center", color:"#999", lineHeight:1.6}}>
              <div>
                <div style={{fontSize:32, marginBottom:8}}>🗓️</div>
                タップして推しを登録<br/>
                <span style={{fontSize:12}}>正式名 + ニックネーム最大3件</span>
              </div>
            </div>
          ) : (
            <div style={{color:"#555", fontSize:14, lineHeight:1.8}}>
              {/* Replace this with your real Calendar component + whitelisted fetch */}
              <div>📍 {oshi.formal} のツアー情報を表示</div>
              <div style={{marginTop:8, fontSize:12, color:"#999"}}>
                取得元: instagram.com / tiktok.com / x.com / youtube.com / threads.net (oEmbed) / YouTube Data API v3 / ORICON / ナタリー / モデルプレス (RSS タイトル+リンクのみ)
              </div>
              <div style={{marginTop:12, display:"flex", gap:8, flexWrap:"wrap"}}>
                <span style={{background:"white", border:"1px solid #eee", borderRadius:20, padding:"4px 10px", fontSize:12}}>{oshi.formal}</span>
                {oshi.nicks.map((n,i)=><span key={i} style={{background:"white", border:"1px solid #eee", borderRadius:20, padding:"4px 10px", fontSize:12}}>{n}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{background:"#f8f8f8", borderRadius:16, padding:16, minHeight:220, cursor: isEmpty ? "pointer" : "default"}}>
          <div style={{fontSize:13, fontWeight:600, color:"#888", marginBottom:12}}>マップ</div>
          {isEmpty ? (
            <div style={{height:140, display:"grid", placeItems:"center", color:"#bbb", fontSize:12}}>日本国内ツアーのみ対象</div>
          ) : (
            <div style={{height:140, display:"grid", placeItems:"center", background:"white", borderRadius:12, border:"1px dashed #ddd", color:"#888", fontSize:12}}>
              Map pins for {oshi.formal}
            </div>
          )}
        </div>

        <div style={{textAlign:"center", padding:"8px 0 24px", fontSize:11, color:"#aaa"}}>
          <a href="/terms" style={{color:"#aaa", textDecoration:"underline"}}>利用規約</a>
          <span style={{margin:"0 8px"}}>·</span>
          <span>プライバシー: 端末内のみ保存、サーバー送信なし</span>
        </div>
      </main>

      {/* Settings Bottom Sheet - no separate page */}
      {showSheet && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", zIndex:50}} onClick={() => setShowSheet(false)}>
          <div style={{width:"100%", maxWidth:480, margin:"0 auto", background:"white", borderRadius:"24px 24px 0 0", padding:"24px 20px 32px", maxHeight:"85dvh", overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40, height:4, background:"#ddd", borderRadius:10, margin:"0 auto 16px"}}/>
            <h3 style={{fontSize:18, fontWeight:700, marginBottom:4}}>推しを登録</h3>
            <p style={{fontSize:12, color:"#888", marginBottom:16}}>正式名 + 最大3件のニックネーム。端末内のみ保存。</p>
            
            <label style={{fontSize:12, fontWeight:600, color:"#555"}}>正式名</label>
            <input placeholder="例: 山崎育三郎" value={formal} onChange={e=>setFormal(e.target.value)} style={{width:"100%", padding:"14px 12px", marginTop:6, borderRadius:10, border:"1px solid #ddd", fontSize:16, boxSizing:"border-box"}} />

            <label style={{fontSize:12, fontWeight:600, color:"#555", marginTop:16, display:"block"}}>ニックネーム (最大3件)</label>
            {nicks.map((n,i)=>(
              <input key={i} placeholder={`ニックネーム ${i+1} (任意)`} value={n} onChange={e=>{
                const c=[...nicks]; c[i]=e.target.value; setNicks(c)
              }} style={{width:"100%", padding:"14px 12px", marginTop:8, borderRadius:10, border:"1px solid #ddd", fontSize:16, boxSizing:"border-box"}} />
            ))}

            <button onClick={save} style={{width:"100%", marginTop:20, padding:"16px", borderRadius:12, background:"black", color:"white", fontWeight:700, fontSize:15, border:"none", cursor:"pointer"}}>保存して表示</button>
            
            {oshi?.formal && (
              <button onClick={clear} style={{width:"100%", marginTop:10, padding:"14px", borderRadius:12, background:"white", color:"#888", fontSize:13, border:"1px solid #eee", cursor:"pointer"}}>登録を削除して空白に戻す</button>
            )}

            <div style={{textAlign:"center", marginTop:16, fontSize:11, color:"#aaa"}}>
              保存先: localStorage (サーバー送信なし)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
