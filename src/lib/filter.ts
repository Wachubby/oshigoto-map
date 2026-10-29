export type WhitelistedVenue = {
  name: string;
  aliases?: string[];
  allowed: boolean;
};

export type VenueEventCandidate = {
  venue: string;
  url?: string;
  prefecture?: string;
};

export type VenueReviewCollector = {
  track: (venueName: string, postUrl?: string, suspectedRegion?: string) => unknown;
};

export type VenueEventClassification<T> = {
  approved: T[];
  reviewCandidates: T[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase("ja-JP").normalize("NFKC").replace(/[\s\p{P}\p{S}]+/gu, "");
}

function normalizeOshiTerm(value: string) {
  const canonical = value.match(/canonical_name\s*=\s*([^】]+)/i)?.[1];
  const entity = value.match(/entity-([^¦】]+)/i)?.[1];
  return normalize(canonical ?? entity ?? value);
}

const JUICE_JUICE_NAMES = ["Juice=Juice", "ジュースジュース"].map(normalize);

export function isJuiceJuiceGroupName(value: string) {
  return JUICE_JUICE_NAMES.includes(normalizeOshiTerm(value));
}

export function isJuiceJuiceGroupMode(helpers: string[]) {
  return helpers.some(isJuiceJuiceGroupName);
}

export type OfficialGroupEventCandidate = {
  title: string;
  searchText?: string;
  groupNames: string[];
};

export type OfficialEventProfile = {
  name?: string;
  displayName?: string;
  helpers: string[];
};

export function filterOfficialGroupEvents<T extends OfficialGroupEventCandidate>(
  events: T[],
  profile: OfficialEventProfile,
) {
  const isGroupMode = isJuiceJuiceGroupMode(profile.helpers);
  if (isGroupMode) {
    return {
      isGroupMode,
      events: events.filter((event) => event.groupNames.some(isJuiceJuiceGroupName)),
    };
  }

  const terms = [profile.displayName, profile.name, ...profile.helpers]
    .map((term) => term?.trim() ?? "")
    .filter(Boolean);
  return {
    isGroupMode,
    events: events.filter((event) =>
      textMatchesTerms(`${event.title} ${event.searchText ?? ""}`, terms),
    ),
  };
}

export function classifyVenueEvents<T extends VenueEventCandidate>(
  candidates: T[],
  venues: WhitelistedVenue[],
  collector: VenueReviewCollector,
): VenueEventClassification<T> {
  const approvedNames = new Set(
    venues
      .filter((venue) => venue.allowed === true)
      .flatMap((venue) => [venue.name, ...(venue.aliases ?? [])])
      .map(normalize),
  );
  const approved: T[] = [];
  const reviewCandidates: T[] = [];

  for (const candidate of candidates) {
    if (!candidate.venue.trim() || candidate.venue === "会場未記載") {
      reviewCandidates.push(candidate);
      continue;
    }

    if (approvedNames.has(normalize(candidate.venue))) {
      approved.push(candidate);
      continue;
    }

    reviewCandidates.push(candidate);
    collector.track(candidate.venue, candidate.url, candidate.prefecture);
  }

  return { approved, reviewCandidates };
}

export type SocialPostCandidate = {
  id: string;
  author?: string;
  authorType?: "group" | "personal" | "other";
  caption?: string;
  title?: string;
  tags?: string[];
};

export type SocialFilterProfile = {
  name: string;
  helpers: string[];
};

export type SocialFilterResult<T> = {
  mode: "A" | "B";
  posts: T[];
  groupName?: string;
};

function textMatchesTerms(text: string, terms: string[]) {
  const normalizedText = normalize(text);
  return terms.some((term) => normalizedText.includes(normalize(term)));
}

export function filterSocialPosts<T extends SocialPostCandidate>(
  posts: T[],
  profile: SocialFilterProfile,
): SocialFilterResult<T> {
  const helpers = profile.helpers.map((helper) => helper.trim()).filter(Boolean);
  const matchingGroup = helpers.find((helper) =>
    posts.some(
      (post) =>
        post.authorType === "group" &&
        post.author &&
        normalizeOshiTerm(post.author) === normalizeOshiTerm(helper),
    ),
  );

  if (matchingGroup) {
    return {
      mode: "A",
      groupName: matchingGroup,
      posts: posts.filter(
        (post) =>
          post.authorType === "group" &&
          post.author &&
          normalizeOshiTerm(post.author) === normalizeOshiTerm(matchingGroup),
      ),
    };
  }

  const terms = [profile.name, ...helpers].filter(Boolean);
  return {
    mode: "B",
    posts: posts.filter((post) => {
      if (post.authorType === "personal") return true;
      const searchableText = [post.caption, post.title, ...(post.tags ?? [])]
        .filter(Boolean)
        .join(" ");
      return textMatchesTerms(searchableText, terms);
    }),
  };
}
