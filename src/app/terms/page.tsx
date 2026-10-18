export const metadata = {
  title: "oshigoto-map-terms",
}

export default function Terms(){
return(
<div style={{maxWidth:720, margin:"40px auto", padding:"0 20px", lineHeight:"1.8"}}>
<a href="/">←戻る</a>
<h1>推しごとマップ 利用規約</h1>
<p style={{color:"#888"}}>制定 2026/10/16 / info@wachubby.com</p>

<h3>第1条 適用</h3><p>本規約は推しごとマップの利用条件を定めます。</p>
<h3>第2条 定義</h3><p>「推し」とは正式名+最大3件のニックネーム。日本国内ツアーのみ対象。</p>
<h3>第3条 取得元（ホワイトリスト制・ドメイン単位）</h3>
<p>platforms: instagram.com, tiktok.com, x.com, youtube.com, threads.net は個別URLのoEmbedのみ。YouTubeはData API v3。正規メディア: ORICON, ナタリー, モデルプレスはRSSタイトル+リンクのみ。</p>
<h3>第4条 キーワード登録</h3><p>正式名+最大3件、端末内のみ。初期表示は空白。</p>
<h3>第5条 表示形式</h3><p>タイトル+リンクのみ。</p>
<h3>第6条 学習</h3><p>「違う」で非表示+匿名学習。</p>
<h3>第7条 禁止事項</h3><p>スクレイピング、営利転載禁止。</p>
<h3>第8条 免責</h3><p>公式情報は各公式サイトを確認。</p>
<h3>第9条 変更</h3><p>変更時は本ページで告知。</p>
<h3>第10条 準拠法</h3><p>日本法、東京地裁管轄。</p>

<hr style={{margin:"40px 0"}}/>
<p style={{fontSize:13, color:"#888"}}>
プライバシーポリシー: キーワードは端末内(localStorage)のみ保存、サーバー送信なし。YouTube/X/Instagram等の公式API取得時にキーワードとIPが送信されます。第三者提供なし。お問い合わせ info@wachubby.com
</p>
</div>
)
}
