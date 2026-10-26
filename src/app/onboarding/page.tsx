"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import oshiTypes from "@/data/oshi_types.json";
import {
  readOshiProfile,
  saveOshiProfile,
  type OshiProfile,
} from "@/lib/oshi-profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [oshiType, setOshiType] = useState("");
  const [helpers, setHelpers] = useState(["", "", ""]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedProfile = readOshiProfile(localStorage);
      if (!savedProfile) return;
      setName(savedProfile.name);
      setOshiType(String(savedProfile.oshi_type));
      setHelpers([savedProfile.helper1, savedProfile.helper2, savedProfile.helper3]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "保存された推し情報を読み取れません。",
      );
    }
  }, []);

  function updateHelper(index: number, value: string) {
    setHelpers((current) => current.map((helper, i) => (i === index ? value : helper)));
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const profile: OshiProfile = {
      name: name.trim(),
      oshi_type: Number(oshiType),
      helper1: helpers[0].trim(),
      helper2: helpers[1].trim(),
      helper3: helpers[2].trim(),
    };

    if (!profile.name || !oshiType) {
      setError("推しの名前とジャンルを入力してください。");
      return;
    }

    try {
      saveOshiProfile(localStorage, profile);
      router.replace("/calendar");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "この端末に保存できませんでした。ブラウザの保存設定を確認してください。",
      );
    }
  }

  return (
    <main className="min-h-dvh bg-[#fff7fb] px-4 py-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="mt-4 text-2xl font-bold">推しを登録</h1>
        <p className="mt-2 text-sm text-gray-600">
          推しの情報をこのブラウザに保存します。あとからいつでも編集できます。
        </p>

        <form onSubmit={saveProfile} className="mt-6 space-y-5">
          <div>
            <label htmlFor="oshi-name" className="mb-1 block text-sm font-medium">
              推しの名前
            </label>
            <input
              id="oshi-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-[#FF2D78] focus:outline-none focus:ring-2 focus:ring-pink-100"
              placeholder="例：アーティスト名"
            />
          </div>

          <div>
            <label htmlFor="oshi-type" className="mb-1 block text-sm font-medium">
              推しのジャンル
            </label>
            <select
              id="oshi-type"
              name="oshi_type"
              value={oshiType}
              onChange={(event) => setOshiType(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-[#FF2D78] focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              <option value="">ジャンルを選択してください</option>
              {(oshiTypes as { id: number; jp: string; en: string }[]).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.jp}（{type.en}）
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">呼び名・検索キーワード（任意）</legend>
            {helpers.map((helper, index) => (
              <div key={index}>
                <label htmlFor={`helper-${index + 1}`} className="mb-1 block text-sm text-gray-600">
                  helper {index + 1}
                </label>
                <input
                  id={`helper-${index + 1}`}
                  name={`helper${index + 1}`}
                  value={helper}
                  onChange={(event) => updateHelper(index, event.target.value)}
                  maxLength={80}
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-[#FF2D78] focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
              </div>
            ))}
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-full bg-[#FF2D78] px-4 py-3 font-semibold text-white transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
          >
            保存してカレンダーへ
          </button>
          <p className="text-center text-xs text-gray-500">
            推し情報はこのブラウザの localStorage に保存されます。
          </p>
        </form>
      </div>
    </main>
  );
}
