import {
  calculateProjectRating,
  calculateUserRating,
  getProfileCompletenessScore,
  getProjectCompletenessScore,
  isWithinTimeframe,
  type LeaderboardTimeframe,
} from "@/lib/leaderboards";
import { createClient } from "@/lib/supabase/server";

type PublicProfileRow = {
  id: string;
  user_id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  country_id: number | null;
  city: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  contact_email: string | null;
  telegram_username: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  experience_level: string | null;
  experience_years: number | null;
  employment_types: string[] | null;
  work_formats: string[] | null;
  salary_expectations: string | null;
  salary_currency: string | null;
  additional_info: string | null;
};

type PublicProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  role: string | null;
  project_status: string | null;
  team_size: number | null;
  project_url: string | null;
  repository_url: string | null;
  started_on: string | null;
  completed_on: string | null;
  problem: string | null;
  solution: string | null;
  results: string | null;
  cover_url: string | null;
  created_at: string | null;
};

type VoteRow = { project_id: string; user_id: string; value: number; created_at: string | null };
type ProfileVoteRow = { profile_id: string; user_id: string; value: number; created_at: string | null };
type MediaRow = { project_id: string; media_kind: string | null; created_at: string | null };
type ProjectSkillRow = { project_id: string; skill_id: number };
type ProfileRelationRow = { profile_id: string; skill_id?: number; language_id?: number };
type ProfileSectionRow = { profile_id: string };

export type RankedProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  ownerName: string | null;
  ownerUsername: string | null;
  rating: number;
  likes: number;
  dislikes: number;
  monthlyLikes: number;
  monthlyDislikes: number;
  mediaCount: number;
  technologyCount: number;
};

export type RankedCreator = {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  headline: string | null;
  rating: number;
  profileCompleteness: number;
  profileLikes: number;
  profileDislikes: number;
  projectCount: number;
  topProjectTitle: string | null;
  topProjectScore: number;
};

export type LeaderboardsResult = {
  creators: Record<LeaderboardTimeframe, RankedCreator[]>;
  projects: Record<LeaderboardTimeframe, RankedProject[]>;
};

function countVotes(rows: VoteRow[] | ProfileVoteRow[], timeframe: LeaderboardTimeframe) {
  return rows.reduce((result, row) => {
    if (timeframe === "month" && !isWithinTimeframe(row.created_at, "month")) return result;
    if (row.value === 1) result.likes += 1;
    if (row.value === -1) result.dislikes += 1;
    return result;
  }, { likes: 0, dislikes: 0 });
}

async function getOptionalProfileVotes() {
  const supabase = await createClient();
  const response = await supabase.from("profile_votes").select("profile_id, user_id, value, created_at");
  if (response.error) return [] as ProfileVoteRow[];
  return (response.data || []) as ProfileVoteRow[];
}

async function getOptionalProfileSectionRows(table: string) {
  const supabase = await createClient();
  const response = await supabase.from(table).select("profile_id");
  if (response.error) return [] as ProfileSectionRow[];
  return (response.data || []) as ProfileSectionRow[];
}

export async function getLeaderboards(): Promise<LeaderboardsResult> {
  const supabase = await createClient();
  const [profilesResponse, projectsResponse, votesResponse, mediaResponse, projectSkillsResponse, profileSkillsResponse, profileLanguagesResponse, profileEducationRows, profileCertificateRows, profileQaRows, profileWorkExperienceRows, profileVotes] = await Promise.all([
    supabase.from("profiles").select("id, user_id, username, name, avatar_url, headline, bio, country_id, city, website, github, twitter, linkedin, contact_email, telegram_username, phone, preferred_contact_method, experience_level, experience_years, employment_types, work_formats, salary_expectations, salary_currency, additional_info").not("username", "is", null),
    supabase.from("projects").select("id, owner_id, title, slug, description, role, project_status, team_size, project_url, repository_url, started_on, completed_on, problem, solution, results, cover_url, created_at"),
    supabase.from("votes").select("project_id, user_id, value, created_at"),
    supabase.from("project_media").select("project_id, media_kind, created_at"),
    supabase.from("project_skills").select("project_id, skill_id"),
    supabase.from("profile_skills").select("profile_id, skill_id"),
    supabase.from("profile_languages").select("profile_id, language_id"),
    getOptionalProfileSectionRows("profile_education"),
    getOptionalProfileSectionRows("profile_certificates"),
    getOptionalProfileSectionRows("profile_qas"),
    getOptionalProfileSectionRows("profile_work_experience"),
    getOptionalProfileVotes(),
  ]);

  const profiles = (profilesResponse.data || []) as PublicProfileRow[];
  const projects = (projectsResponse.data || []) as PublicProjectRow[];
  const votes = (votesResponse.data || []) as VoteRow[];
  const media = (mediaResponse.data || []) as MediaRow[];
  const projectSkills = (projectSkillsResponse.data || []) as ProjectSkillRow[];
  const profileSkills = (profileSkillsResponse.data || []) as ProfileRelationRow[];
  const profileLanguages = (profileLanguagesResponse.data || []) as ProfileRelationRow[];

  const profileByUserId = new Map<string, PublicProfileRow>();
  for (const profile of profiles) profileByUserId.set(profile.user_id, profile);

  const votesByProject = new Map<string, VoteRow[]>();
  for (const vote of votes) {
    const existing = votesByProject.get(vote.project_id) || [];
    existing.push(vote);
    votesByProject.set(vote.project_id, existing);
  }

  const mediaByProject = new Map<string, MediaRow[]>();
  for (const item of media) {
    const existing = mediaByProject.get(item.project_id) || [];
    existing.push(item);
    mediaByProject.set(item.project_id, existing);
  }

  const projectSkillIds = new Map<string, Set<number>>();
  for (const relation of projectSkills) {
    const existing = projectSkillIds.get(relation.project_id) || new Set<number>();
    existing.add(relation.skill_id);
    projectSkillIds.set(relation.project_id, existing);
  }

  const profileSkillIds = new Map<string, Set<number>>();
  for (const relation of profileSkills) {
    if (typeof relation.skill_id !== "number") continue;
    const existing = profileSkillIds.get(relation.profile_id) || new Set<number>();
    existing.add(relation.skill_id);
    profileSkillIds.set(relation.profile_id, existing);
  }

  const profileLanguageIds = new Map<string, Set<number>>();
  for (const relation of profileLanguages) {
    if (typeof relation.language_id !== "number") continue;
    const existing = profileLanguageIds.get(relation.profile_id) || new Set<number>();
    existing.add(relation.language_id);
    profileLanguageIds.set(relation.profile_id, existing);
  }

  const profileVotesByProfile = new Map<string, ProfileVoteRow[]>();
  for (const vote of profileVotes) {
    const existing = profileVotesByProfile.get(vote.profile_id) || [];
    existing.push(vote);
    profileVotesByProfile.set(vote.profile_id, existing);
  }

  const countSectionRows = (rows: ProfileSectionRow[]) => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.profile_id, (map.get(row.profile_id) || 0) + 1);
    return map;
  };

  const educationCountByProfile = countSectionRows(profileEducationRows);
  const certificateCountByProfile = countSectionRows(profileCertificateRows);
  const qaCountByProfile = countSectionRows(profileQaRows);
  const workExperienceCountByProfile = countSectionRows(profileWorkExperienceRows);

  const projectsByOwner = new Map<string, PublicProjectRow[]>();
  for (const project of projects) {
    const existing = projectsByOwner.get(project.owner_id) || [];
    existing.push(project);
    projectsByOwner.set(project.owner_id, existing);
  }

  const ratedProjectsByTimeframe: Record<LeaderboardTimeframe, RankedProject[]> = { all: [], month: [] };
  const projectRatingsByTimeframe = { all: new Map<string, number>(), month: new Map<string, number>() };

  for (const timeframe of ["all", "month"] as const) {
    for (const project of projects) {
      const projectVotes = votesByProject.get(project.id) || [];
      const overallVoteSummary = countVotes(projectVotes, "all");
      const recentVoteSummary = countVotes(projectVotes, "month");
      const mediaItems = mediaByProject.get(project.id) || [];
      const mediaCount = mediaItems.length;
      const recentMediaCount = mediaItems.filter((item) => isWithinTimeframe(item.created_at, "month")).length;
      const technologyCount = (projectSkillIds.get(project.id) || new Set<number>()).size;
      const completenessScore = getProjectCompletenessScore({ description: project.description, role: project.role, status: project.project_status, teamSize: project.team_size, projectUrl: project.project_url, repositoryUrl: project.repository_url, startedOn: project.started_on, completedOn: project.completed_on, problem: project.problem, solution: project.solution, results: project.results, coverUrl: project.cover_url, mediaCount, technologyCount });
      const rating = calculateProjectRating({ timeframe, likes: overallVoteSummary.likes, dislikes: overallVoteSummary.dislikes, recentLikes: recentVoteSummary.likes, recentDislikes: recentVoteSummary.dislikes, totalVotes: overallVoteSummary.likes + overallVoteSummary.dislikes, recentVotes: recentVoteSummary.likes + recentVoteSummary.dislikes, mediaCount, recentMediaCount, technologyCount, completenessScore, createdAt: project.created_at });
      const ownerProfile = profileByUserId.get(project.owner_id);
      if (!project.slug) continue;
      projectRatingsByTimeframe[timeframe].set(project.id, rating);
      ratedProjectsByTimeframe[timeframe].push({ id: project.id, title: project.title, slug: project.slug, description: project.description, cover_url: project.cover_url, ownerName: ownerProfile?.name ?? null, ownerUsername: ownerProfile?.username ?? null, rating, likes: overallVoteSummary.likes, dislikes: overallVoteSummary.dislikes, monthlyLikes: recentVoteSummary.likes, monthlyDislikes: recentVoteSummary.dislikes, mediaCount, technologyCount });
    }
    ratedProjectsByTimeframe[timeframe].sort((left, right) => right.rating - left.rating || (timeframe === "month" ? right.monthlyLikes - left.monthlyLikes : right.likes - left.likes));
  }

  const ratedCreatorsByTimeframe: Record<LeaderboardTimeframe, RankedCreator[]> = { all: [], month: [] };

  for (const timeframe of ["all", "month"] as const) {
    for (const profile of profiles) {
      if (!profile.username) continue;
      const ownedProjects = projectsByOwner.get(profile.user_id) || [];
      const ownedProjectIds = ownedProjects.map((project) => project.id);
      const ownedProjectRatings = ownedProjectIds.map((projectId) => projectRatingsByTimeframe[timeframe].get(projectId) || 0).filter((value) => value > 0);
      const bestProjectScore = Math.max(...ownedProjectRatings, 0);
      const averageProjectScore = ownedProjectRatings.length > 0 ? ownedProjectRatings.reduce((sum, item) => sum + item, 0) / ownedProjectRatings.length : 0;
      const profileVoteRows = profileVotesByProfile.get(profile.id) || [];
      const overallProfileVoteSummary = countVotes(profileVoteRows, "all");
      const recentProfileVoteSummary = countVotes(profileVoteRows, "month");
      const projectVoteRows = ownedProjectIds.flatMap((projectId) => votesByProject.get(projectId) || []);
      const mediaRows = ownedProjectIds.flatMap((projectId) => mediaByProject.get(projectId) || []);
      const recentProjectCount = ownedProjects.filter((project) => isWithinTimeframe(project.created_at, "month")).length;
      const uniqueTechnologyIds = new Set<number>([...(profileSkillIds.get(profile.id) || new Set<number>()), ...ownedProjectIds.flatMap((projectId) => Array.from(projectSkillIds.get(projectId) || new Set<number>()))]);
      const profileCompleteness = getProfileCompletenessScore({ username: profile.username, name: profile.name, avatarUrl: profile.avatar_url, headline: profile.headline, bio: profile.bio, countryId: profile.country_id, city: profile.city, website: profile.website, github: profile.github, twitter: profile.twitter, linkedin: profile.linkedin, contactEmail: profile.contact_email, telegramUsername: profile.telegram_username, phone: profile.phone, preferredContactMethod: profile.preferred_contact_method, experienceLevel: profile.experience_level, experienceYears: profile.experience_years, employmentTypesCount: profile.employment_types?.length || 0, workFormatsCount: profile.work_formats?.length || 0, salaryExpectations: profile.salary_expectations, salaryCurrency: profile.salary_currency, additionalInfo: profile.additional_info, skillsCount: (profileSkillIds.get(profile.id) || new Set<number>()).size, languagesCount: (profileLanguageIds.get(profile.id) || new Set<number>()).size, educationCount: educationCountByProfile.get(profile.id) || 0, certificateCount: certificateCountByProfile.get(profile.id) || 0, qaCount: qaCountByProfile.get(profile.id) || 0, workExperienceCount: workExperienceCountByProfile.get(profile.id) || 0 });
      const recentProjectVoteRows = projectVoteRows.filter((vote) => isWithinTimeframe(vote.created_at, "month"));
      const recentMediaCount = mediaRows.filter((item) => isWithinTimeframe(item.created_at, "month")).length;
      const rating = calculateUserRating({ timeframe, profileLikes: overallProfileVoteSummary.likes, profileDislikes: overallProfileVoteSummary.dislikes, recentProfileLikes: recentProfileVoteSummary.likes, recentProfileDislikes: recentProfileVoteSummary.dislikes, profileVotes: overallProfileVoteSummary.likes + overallProfileVoteSummary.dislikes, recentProfileVotes: recentProfileVoteSummary.likes + recentProfileVoteSummary.dislikes, profileCompleteness, projectCount: ownedProjects.length, recentProjectCount, mediaCount: mediaRows.length, recentMediaCount, technologyCount: uniqueTechnologyIds.size, bestProjectRating: bestProjectScore, averageProjectRating: averageProjectScore, totalProjectVotes: projectVoteRows.length, recentProjectVotes: recentProjectVoteRows.length });
      const topProject = ownedProjects.map((project) => ({ title: project.title, score: projectRatingsByTimeframe[timeframe].get(project.id) || 0 })).sort((left, right) => right.score - left.score)[0];
      ratedCreatorsByTimeframe[timeframe].push({ id: profile.id, username: profile.username, name: profile.name, avatar_url: profile.avatar_url, headline: profile.headline, rating, profileCompleteness: Math.round(profileCompleteness * 100), profileLikes: overallProfileVoteSummary.likes, profileDislikes: overallProfileVoteSummary.dislikes, projectCount: ownedProjects.length, topProjectTitle: topProject?.title || null, topProjectScore: topProject?.score || 0 });
    }
    ratedCreatorsByTimeframe[timeframe].sort((left, right) => right.rating - left.rating || right.topProjectScore - left.topProjectScore || right.projectCount - left.projectCount);
  }

  return {
    creators: { all: ratedCreatorsByTimeframe.all.slice(0, 10), month: ratedCreatorsByTimeframe.month.slice(0, 10) },
    projects: { all: ratedProjectsByTimeframe.all.slice(0, 10), month: ratedProjectsByTimeframe.month.slice(0, 10) },
  };
}
