import oshiTypes from "@/data/oshi_types.json";

export const OSHI_PROFILE_STORAGE_KEY = "oshigoto-map:oshi-profile";

export type OshiProfile = {
  name: string;
  oshi_type: number;
  helper1: string;
  helper2: string;
  helper3: string;
};

export type OshiSearchProfile = {
  formal: string;
  nicknames: string[];
};

export function parseOshiProfile(value: string | null): OshiProfile | null {
  if (value === null) return null;

  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("保存された推し情報を読み取れません。もう一度登録してください。");
  }

  const profile = parsed as Partial<OshiProfile>;
  const validTypeIds = new Set((oshiTypes as { id: number }[]).map((type) => type.id));
  if (
    typeof profile.name !== "string" ||
    !profile.name.trim() ||
    typeof profile.oshi_type !== "number" ||
    !validTypeIds.has(profile.oshi_type) ||
    ![profile.helper1, profile.helper2, profile.helper3].every(
      (helper) => typeof helper === "string",
    )
  ) {
    throw new Error("保存された推し情報が無効です。もう一度登録してください。");
  }

  return {
    name: profile.name.trim(),
    oshi_type: profile.oshi_type,
    helper1: profile.helper1!.trim(),
    helper2: profile.helper2!.trim(),
    helper3: profile.helper3!.trim(),
  };
}

export function toOshiSearchProfile(profile: OshiProfile): OshiSearchProfile {
  return {
    formal: profile.name,
    nicknames: [profile.helper1, profile.helper2, profile.helper3].filter(Boolean),
  };
}
