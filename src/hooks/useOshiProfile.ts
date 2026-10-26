"use client";

import { useEffect, useState } from "react";
import {
  OSHI_PROFILE_STORAGE_KEY,
  parseOshiProfile,
  type OshiProfile,
} from "@/lib/oshi-profile";

export function useOshiProfile() {
  const [profile, setProfile] = useState<OshiProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setProfile(parseOshiProfile(localStorage.getItem(OSHI_PROFILE_STORAGE_KEY)));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "推し情報を読み取れません。もう一度登録してください。",
      );
    } finally {
      setReady(true);
    }
  }, []);

  return { profile, ready, error };
}
