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
  const matchingGroups = new Set(
    events
      .flatMap((event) => event.groupNames)
      .filter((groupName) =>
        profile.helpers.some(
          (helper) => normalizeOshiTerm(helper) === normalizeOshiTerm(groupName),
        ),
      )
      .map(normalizeOshiTerm),
  );
  const isGroupMode = matchingGroups.size > 0;
  if (isGroupMode) {
    return {
      isGroupMode,
      events: events.filter((event) =>
        event.groupNames.some((groupName) => matchingGroups.has(normalizeOshiTerm(groupName))),
      ),
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
  displayName: string;
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
  const helperTerms = new Set(helpers.map(normalizeOshiTerm));
  const matchingGroupAuthors = [
    ...new Set(
      posts
        .filter((post) => post.authorType === "group" && post.author?.trim())
        .map((post) => post.author!.trim())
        .filter((author) => helperTerms.has(normalizeOshiTerm(author))),
    ),
  ];

  if (matchingGroupAuthors.length > 0) {
    const matchingGroups = new Set(matchingGroupAuthors.map(normalizeOshiTerm));
    return {
      mode: "A",
      groupName: matchingGroupAuthors[0],
      posts: posts.filter(
        (post) =>
          post.authorType === "group" &&
          post.author &&
          matchingGroups.has(normalizeOshiTerm(post.author)),
      ),
    };
  }

  const terms = [profile.displayName, ...helpers].filter(Boolean);
  return {
    mode: "B",
    posts: posts.filter((post) => {
      if (post.authorType === "personal") return true;
      const searchableText = [post.caption, ...(post.tags ?? [])]
        .filter(Boolean)
        .join(" ");
      return textMatchesTerms(searchableText, terms);
    }),
  };
}
