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
        normalize(post.author) === normalize(helper),
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
          normalize(post.author) === normalize(matchingGroup),
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
