export type LeaderboardTimeframe = "all" | "month";

const monthWindowMs = 30 * 24 * 60 * 60 * 1000;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isWithinTimeframe(
  value: string | null | undefined,
  timeframe: LeaderboardTimeframe,
) {
  if (timeframe === "all") {
    return true;
  }

  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= monthWindowMs;
}

export function getWilsonScore(positive: number, negative: number) {
  const total = positive + negative;

  if (total === 0) {
    return 0;
  }

  const z = 1.96;
  const phat = positive / total;

  return (
    (phat + (z * z) / (2 * total) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total)) /
    (1 + (z * z) / total)
  );
}

function getWeightedCompletionScore(values: Array<{ filled: boolean; weight: number }>) {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const filledWeight = values.reduce(
    (sum, item) => sum + (item.filled ? item.weight : 0),
    0,
  );

  return filledWeight / totalWeight;
}

export function getProfileCompletenessScore(input: {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  countryId: number | null;
  city: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  contactEmail: string | null;
  telegramUsername: string | null;
  phone: string | null;
  preferredContactMethod: string | null;
  experienceLevel: string | null;
  experienceYears: number | null;
  employmentTypesCount: number;
  workFormatsCount: number;
  salaryExpectations: string | null;
  salaryCurrency: string | null;
  additionalInfo: string | null;
  skillsCount: number;
  languagesCount: number;
  educationCount: number;
  certificateCount: number;
  qaCount: number;
  workExperienceCount: number;
}) {
  return getWeightedCompletionScore([
    { filled: Boolean(input.username), weight: 1.5 },
    { filled: Boolean(input.name), weight: 1 },
    { filled: Boolean(input.avatarUrl), weight: 1.2 },
    { filled: Boolean(input.headline), weight: 1 },
    { filled: Boolean(input.bio), weight: 1.4 },
    { filled: Boolean(input.countryId), weight: 0.8 },
    { filled: Boolean(input.city), weight: 0.5 },
    { filled: Boolean(input.website), weight: 0.8 },
    { filled: Boolean(input.github), weight: 0.8 },
    { filled: Boolean(input.twitter), weight: 0.5 },
    { filled: Boolean(input.linkedin), weight: 0.8 },
    {
      filled:
        Boolean(input.contactEmail) ||
        Boolean(input.telegramUsername) ||
        Boolean(input.phone),
      weight: 0.9,
    },
    { filled: Boolean(input.preferredContactMethod), weight: 0.4 },
    {
      filled: Boolean(input.experienceLevel) || input.experienceYears !== null,
      weight: 1,
    },
    { filled: input.employmentTypesCount > 0, weight: 0.8 },
    { filled: input.workFormatsCount > 0, weight: 0.8 },
    {
      filled: Boolean(input.salaryExpectations) && Boolean(input.salaryCurrency),
      weight: 0.7,
    },
    { filled: Boolean(input.additionalInfo), weight: 0.9 },
    { filled: input.skillsCount > 0, weight: 1.4 },
    { filled: input.languagesCount > 0, weight: 0.8 },
    { filled: input.educationCount > 0, weight: 1 },
    { filled: input.certificateCount > 0, weight: 1 },
    { filled: input.qaCount > 0, weight: 1.1 },
    { filled: input.workExperienceCount > 0, weight: 1.3 },
  ]);
}

export function getProjectCompletenessScore(input: {
  description: string | null;
  role: string | null;
  status: string | null;
  teamSize: number | null;
  projectUrl: string | null;
  repositoryUrl: string | null;
  startedOn: string | null;
  completedOn: string | null;
  problem: string | null;
  solution: string | null;
  results: string | null;
  coverUrl: string | null;
  mediaCount: number;
  technologyCount: number;
}) {
  return getWeightedCompletionScore([
    { filled: Boolean(input.description), weight: 1.2 },
    { filled: Boolean(input.role), weight: 0.8 },
    { filled: Boolean(input.status), weight: 0.5 },
    { filled: Boolean(input.teamSize), weight: 0.4 },
    { filled: Boolean(input.projectUrl), weight: 0.7 },
    { filled: Boolean(input.repositoryUrl), weight: 0.7 },
    { filled: Boolean(input.startedOn), weight: 0.5 },
    { filled: Boolean(input.completedOn), weight: 0.5 },
    { filled: Boolean(input.problem), weight: 1 },
    { filled: Boolean(input.solution), weight: 1.2 },
    { filled: Boolean(input.results), weight: 1 },
    { filled: Boolean(input.coverUrl), weight: 1 },
    { filled: input.mediaCount > 0, weight: 1 },
    { filled: input.technologyCount > 0, weight: 1 },
  ]);
}

export function calculateProjectRating(input: {
  timeframe: LeaderboardTimeframe;
  likes: number;
  dislikes: number;
  recentLikes: number;
  recentDislikes: number;
  totalVotes: number;
  recentVotes: number;
  mediaCount: number;
  recentMediaCount: number;
  technologyCount: number;
  completenessScore: number;
  createdAt: string | null;
}) {
  const overallQuality = getWilsonScore(input.likes, input.dislikes);
  const recentQuality = getWilsonScore(input.recentLikes, input.recentDislikes);
  const baseQuality =
    input.timeframe === "month"
      ? recentQuality * 70 + overallQuality * 8
      : overallQuality * 64;
  const voteMomentum =
    Math.log1p(input.timeframe === "month" ? input.recentVotes : input.totalVotes) * 7;
  const completenessPoints = input.completenessScore * (input.timeframe === "month" ? 14 : 20);
  const mediaPoints =
    Math.min(input.timeframe === "month" ? input.recentMediaCount : input.mediaCount, 8) *
    1.35;
  const technologyPoints = Math.min(input.technologyCount, 10) * 0.9;
  const freshnessPoints =
    input.createdAt && isWithinTimeframe(input.createdAt, "month")
      ? input.timeframe === "month"
        ? 10
        : 4
      : 0;

  return Math.round(
    baseQuality +
      voteMomentum +
      completenessPoints +
      mediaPoints +
      technologyPoints +
      freshnessPoints,
  );
}

export function calculateUserRating(input: {
  timeframe: LeaderboardTimeframe;
  profileLikes: number;
  profileDislikes: number;
  recentProfileLikes: number;
  recentProfileDislikes: number;
  profileVotes: number;
  recentProfileVotes: number;
  profileCompleteness: number;
  projectCount: number;
  recentProjectCount: number;
  mediaCount: number;
  recentMediaCount: number;
  technologyCount: number;
  bestProjectRating: number;
  averageProjectRating: number;
  totalProjectVotes: number;
  recentProjectVotes: number;
}) {
  const overallProfileQuality = getWilsonScore(input.profileLikes, input.profileDislikes);
  const recentProfileQuality = getWilsonScore(
    input.recentProfileLikes,
    input.recentProfileDislikes,
  );
  const profileQuality =
    input.timeframe === "month"
      ? recentProfileQuality * 28 + overallProfileQuality * 5
      : overallProfileQuality * 32;
  const profileVoteMomentum =
    Math.log1p(input.timeframe === "month" ? input.recentProfileVotes : input.profileVotes) *
    4;
  const profileCompleteness =
    input.profileCompleteness * (input.timeframe === "month" ? 14 : 24);
  const projectStrength =
    input.timeframe === "month"
      ? input.averageProjectRating * 0.42 + input.bestProjectRating * 0.18
      : input.averageProjectRating * 0.46 + input.bestProjectRating * 0.22;
  const productionPoints =
    Math.min(input.timeframe === "month" ? input.recentProjectCount : input.projectCount, 10) *
      1.8 +
    Math.min(input.timeframe === "month" ? input.recentMediaCount : input.mediaCount, 12) *
      0.7;
  const techBreadth = Math.min(input.technologyCount, 12) * 0.85;
  const communityMomentum =
    Math.log1p(
      input.timeframe === "month" ? input.recentProjectVotes : input.totalProjectVotes,
    ) * 2.8;

  return Math.round(
    profileQuality +
      profileVoteMomentum +
      profileCompleteness +
      projectStrength +
      productionPoints +
      techBreadth +
      communityMomentum,
  );
}
