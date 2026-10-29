import oshiTypes from "@/data/oshi_types.json";

export const OSHI_PROFILE_STORAGE_KEY = "oshigoto-map:oshi-profile";
export const OSHI_NAME_STORAGE_KEY = "oshi_name";

const PROFILE_STORAGE_KEYS = {
  type: "oshi_type",
  helper1: "oshi_helper1",
  helper2: "oshi_helper2",
  helper3: "oshi_helper3",
} as const;

export type OshiProfile = {
  name: string;
  oshi_type: number;
  helper1: string;
  helper2: string;
  helper3: string;
};

export type OshiSearchProfile = {
  formal: string;
  displayName: string;
  nicknames: string[];
};

export type OshiProfileStorage = Pick<Storage, "getItem" | "setItem">;

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

export function readOshiProfile(storage: OshiProfileStorage): OshiProfile | null {
  const saved = parseOshiProfile(storage.getItem(OSHI_PROFILE_STORAGE_KEY));
  const name = storage.getItem(OSHI_NAME_STORAGE_KEY)?.trim();
  if (!name) return saved;

  const storedType = Number(storage.getItem(PROFILE_STORAGE_KEYS.type));
  const type = Number.isInteger(storedType) ? storedType : saved?.oshi_type;
  if (type === undefined) return null;

  const profile: OshiProfile = {
    name,
    oshi_type: type,
    helper1: storage.getItem(PROFILE_STORAGE_KEYS.helper1) ?? saved?.helper1 ?? "",
    helper2: storage.getItem(PROFILE_STORAGE_KEYS.helper2) ?? saved?.helper2 ?? "",
    helper3: storage.getItem(PROFILE_STORAGE_KEYS.helper3) ?? saved?.helper3 ?? "",
  };
  return parseOshiProfile(JSON.stringify(profile));
}

export function saveOshiProfile(storage: OshiProfileStorage, profile: OshiProfile) {
  const validated = parseOshiProfile(JSON.stringify(profile));
  if (!validated) throw new Error("推し情報を保存できません。");

  storage.setItem(OSHI_NAME_STORAGE_KEY, validated.name);
  storage.setItem(PROFILE_STORAGE_KEYS.type, String(validated.oshi_type));
  storage.setItem(PROFILE_STORAGE_KEYS.helper1, validated.helper1);
  storage.setItem(PROFILE_STORAGE_KEYS.helper2, validated.helper2);
  storage.setItem(PROFILE_STORAGE_KEYS.helper3, validated.helper3);
  storage.setItem(OSHI_PROFILE_STORAGE_KEY, JSON.stringify(validated));
}

export function toOshiSearchProfile(profile: OshiProfile): OshiSearchProfile {
  return {
    formal: profile.name,
    displayName: profile.helper1 || profile.name,
    nicknames: [profile.helper1, profile.helper2, profile.helper3].filter(Boolean),
  };
}
