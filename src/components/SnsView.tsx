"use client";

import { useState } from "react";
import { useWhitelistSearch } from "@/hooks/useWhitelistSearch";

export default function SnsView({ oshi }: { oshi: any }) {
  const { data, loading, error, retry } = useWhitelistSearch(oshi);
  const [hidden, setHidden] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const items = (data?.news ?? []).filter((item) => !hidden.includes(item.id));
  const newsStatuses = data?.sourceStatuses.filter(
    (source) => source.kind === "official" || source.kind === "media",
  ) ?? [];
  const newsErrors = newsStatuses.filter((source) => source.status === "error");
  const sourceIssues = data?.sourceStatuses.filter((source) => source.status !== "ok") ?? [];
  const newsFailed = newsErrors.length > 0 && !newsStatuses.some((source) => source.status === "ok");
  const newsIsEmpty = !loading && !error && items.length === 0 && newsErrors.length === 0;

  return (
    <div className="h-full space-y-3 overflow-y-auto p-3">
      <div className="rounded bg-gray-50 p-2 text-[11px] text-gray-600">
        公式サイトとホワイトリスト内のRSSを検索しています。記事はタイトルとリンクのみ表示します。
        Instagram投稿は認証なしで検索できる公開APIがないため取得しません。
      </div>

      {loading && (
        <div role="status" className="rounded-lg border p-4 text-sm text-gray-500">
          ホワイトリスト内の情報を確認しています…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p>情報を取得できませんでした。通信状況を確認して再試行してください。</p>
          <button onClick={retry} className="mt-2 underline">再試行</button>
        </div>
      )}

      {!loading && !error && newsFailed && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p>情報提供元に接続できませんでした。</p>
          <button onClick={retry} className="mt-2 underline">再試行</button>
        </div>
      )}

      {!loading && !error && newsErrors.length > 0 && !newsFailed && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
          一部の情報提供元に接続できませんでした。表示中の内容は取得できた情報提供元からの結果です。
        </div>
      )}

      {newsIsEmpty && (
        <div role="status" className="rounded-lg border p-4 text-sm text-gray-500">
          ホワイトリスト内に一致する記事はありませんでした。検索結果を作成・補完することはありません。
        </div>
      )}

      {!loading && !error && !newsFailed && items.map((item) => (
        <article key={item.id} className="relative rounded-lg border p-3 pr-10 text-sm">
          <div className="text-[11px] font-bold text-gray-500">
            {item.source}
            {item.kind === "media" && <span className="ml-1 font-normal">（タイトル・リンクのみ）</span>}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium underline decoration-gray-300 underline-offset-2"
          >
            {item.title}
          </a>
          {item.publishedAt && (
            <time className="mt-1 block text-[11px] text-gray-400">
              {new Date(item.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </time>
          )}
          <button
            aria-label="この記事を一時的に非表示"
            onClick={() => setMenu(menu === item.id ? null : item.id)}
            className="absolute right-2 top-2 px-1 text-gray-500"
          >
            ...
          </button>
          {menu === item.id && (
            <div className="absolute right-2 top-8 z-10 rounded border bg-white p-2 text-xs shadow">
              <button
                onClick={() => {
                  setHidden((current) => [...current, item.id]);
                  setMenu(null);
                }}
              >
                この表示中は非表示にする
              </button>
            </div>
          )}
        </article>
      ))}

      {sourceIssues.length > 0 && (
        <details className="rounded border p-3 text-xs text-gray-500">
          <summary className="cursor-pointer">取得できない情報提供元について</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {sourceIssues.map((source) => (
              <li key={`${source.kind}:${source.name}`}>
                <b>{source.name}</b>
                {source.message ? `：${source.message}` : "：現在この画面では取得していません"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
