import { createClient } from "@/lib/supabase/server";

type CreatedAtRow = {
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  user_id: string;
  username: string | null;
  name: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  contact_email: string | null;
  telegram_username: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  avatar_url: string | null;
  country_id: number | null;
  category_id: number | null;
  created_at: string | null;
  experience_level: string | null;
  experience_years: number | null;
  employment_types: string[] | null;
  work_formats: string[] | null;
  salary_expectations: string | null;
  salary_currency: string | null;
  additional_info: string | null;
};

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  slug: string | null;
  project_status: string | null;
  created_at: string | null;
};

type VoteRow = {
  project_id: string;
  value: number | null;
  created_at: string | null;
};

type CountryRow = {
  id: number;
  name: string;
};

type CategoryRow = {
  id: number;
  name: string;
};

type SkillRelationRow = {
  skills: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type ProfileRelationRow = {
  profile_id: string;
};

export type DashboardStats = {
  siteTotals: {
    profiles: number;
    publicProfiles: number;
    countries: number;
    categories: number;
    projects: number;
    votes: number;
    likes: number;
    dislikes: number;
    avgProfileCompletion: number;
    avgProjectScore: number;
  };
  monthlyActivity: Array<{
    key: string;
    profiles: number;
    projects: number;
    votes: number;
  }>;
  statusBreakdown: Array<{
    key: string;
    value: number;
  }>;
  categoryBreakdown: Array<{
    label: string;
    value: number;
  }>;
  countryBreakdown: Array<{
    label: string;
    value: number;
  }>;
  completionBreakdown: Array<{
    key: "starter" | "growing" | "complete";
    value: number;
  }>;
  topProjects: Array<{
    id: string;
    title: string;
    slug: string | null;
    likes: number;
    dislikes: number;
    score: number;
    ownerName: string | null;
    categoryName: string | null;
  }>;
  topSkills: Array<{
    name: string;
    value: number;
  }>;
};

function getMonthKeys(length: number) {
  const keys: string[] = [];
  const current = new Date();
  const firstDayUtc = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1);

  for (let index = length - 1; index >= 0; index -= 1) {
    const date = new Date(firstDayUtc);
    date.setUTCMonth(date.getUTCMonth() - index);
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    keys.push(`${year}-${month}`);
  }

  return keys;
}

function toMonthKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;
}

function aggregateByMonth(rows: CreatedAtRow[], monthKeys: string[]) {
  const counts = new Map<string, number>(monthKeys.map((key) => [key, 0]));

  for (const row of rows) {
    const key = toMonthKey(row.created_at);
    if (!key || !counts.has(key)) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function getRelationName(relation: SkillRelationRow["skills"]) {
  if (Array.isArray(relation)) {
    return relation[0]?.name || null;
  }

  return relation?.name || null;
}

function getCountMap(rows: ProfileRelationRow[]) {
  const countMap = new Map<string, number>();
  for (const row of rows) {
    countMap.set(row.profile_id, (countMap.get(row.profile_id) || 0) + 1);
  }
  return countMap;
}

function getProfileCompletionScore(
  profile: ProfileRow,
  profileSkills: Map<string, number>,
  profileLanguages: Map<string, number>,
  profileEducation: Map<string, number>,
  profileCertificates: Map<string, number>,
  profileQas: Map<string, number>,
  profileWorkExperience: Map<string, number>,
) {
  let filled = 0;
  const total = 15;

  if (profile.username) filled += 1;
  if (profile.avatar_url) filled += 1;
  if (profile.name) filled += 1;
  if (profile.headline) filled += 1;
  if (profile.bio) filled += 1;
  if (profile.country_id) filled += 1;
  if (profile.city) filled += 1;
  if (profile.category_id) filled += 1;
  if (profile.website || profile.github || profile.twitter || profile.linkedin) filled += 1;
  if (
    profile.contact_email ||
    profile.telegram_username ||
    profile.phone ||
    profile.preferred_contact_method
  ) {
    filled += 1;
  }
  if (profile.experience_level || profile.experience_years !== null) filled += 1;
  if (
    (profile.employment_types?.length || 0) > 0 ||
    (profile.work_formats?.length || 0) > 0 ||
    (profile.salary_expectations && profile.salary_currency) ||
    profile.additional_info
  ) {
    filled += 1;
  }
  if ((profileSkills.get(profile.id) || 0) > 0) filled += 1;
  if ((profileLanguages.get(profile.id) || 0) > 0) filled += 1;
  if (
    (profileEducation.get(profile.id) || 0) > 0 ||
    (profileCertificates.get(profile.id) || 0) > 0 ||
    (profileQas.get(profile.id) || 0) > 0
  ) {
    filled += 1;
  }
  if ((profileWorkExperience.get(profile.id) || 0) > 0) filled += 1;

  return Math.round((filled / total) * 100);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const monthKeys = getMonthKeys(6);

  const [
    profilesResponse,
    projectsResponse,
    votesResponse,
    countriesResponse,
    categoriesResponse,
    projectSkillsResponse,
    profileSkillsResponse,
    profileLanguagesResponse,
    profileEducationResponse,
    profileCertificatesResponse,
    profileQasResponse,
    profileWorkExperienceResponse,
  ] = await Promise.all([
    supabase.from("profiles").select("id, user_id, username, name, headline, bio, city, website, github, twitter, linkedin, contact_email, telegram_username, phone, preferred_contact_method, avatar_url, country_id, category_id, created_at, experience_level, experience_years, employment_types, work_formats, salary_expectations, salary_currency, additional_info"),
    supabase.from("projects").select("id, owner_id, title, slug, project_status, created_at"),
    supabase.from("votes").select("project_id, value, created_at"),
    supabase.from("countries").select("id, name"),
    supabase.from("profile_categories").select("id, name"),
    supabase.from("project_skills").select(`project_id, skills ( name )`),
    supabase.from("profile_skills").select(`profile_id, skills ( name )`),
    supabase.from("profile_languages").select("profile_id"),
    supabase.from("profile_education").select("profile_id"),
    supabase.from("profile_certificates").select("profile_id"),
    supabase.from("profile_qas").select("profile_id"),
    supabase.from("profile_work_experience").select("profile_id"),
  ]);

  const profiles = (profilesResponse.data || []) as ProfileRow[];
  const projects = (projectsResponse.data || []) as ProjectRow[];
  const votes = (votesResponse.data || []) as VoteRow[];
  const countries = (countriesResponse.data || []) as CountryRow[];
  const categories = (categoriesResponse.data || []) as CategoryRow[];
  const projectSkills = (projectSkillsResponse.data || []) as Array<SkillRelationRow & { project_id: string }>;
  const profileSkills = (profileSkillsResponse.data || []) as Array<SkillRelationRow & { profile_id: string }>;
  const profileLanguages = (profileLanguagesResponse.data || []) as ProfileRelationRow[];
  const profileEducation = (profileEducationResponse.data || []) as ProfileRelationRow[];
  const profileCertificates = (profileCertificatesResponse.data || []) as ProfileRelationRow[];
  const profileQas = (profileQasResponse.data || []) as ProfileRelationRow[];
  const profileWorkExperience = (profileWorkExperienceResponse.data || []) as ProfileRelationRow[];

  const countryMap = new Map(countries.map((country) => [country.id, country.name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const profileByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const profileSkillCountMap = getCountMap(profileSkills.map((item) => ({ profile_id: item.profile_id })));
  const profileLanguageCountMap = getCountMap(profileLanguages);
  const profileEducationCountMap = getCountMap(profileEducation);
  const profileCertificateCountMap = getCountMap(profileCertificates);
  const profileQaCountMap = getCountMap(profileQas);
  const profileWorkExperienceCountMap = getCountMap(profileWorkExperience);

  const statusCounts = new Map<string, number>();
  for (const project of projects) {
    const key = project.project_status || "unknown";
    statusCounts.set(key, (statusCounts.get(key) || 0) + 1);
  }

  const voteStatsByProject = new Map<string, { likes: number; dislikes: number; score: number }>();
  for (const vote of votes) {
    const current = voteStatsByProject.get(vote.project_id) || { likes: 0, dislikes: 0, score: 0 };
    if (vote.value === 1) {
      current.likes += 1;
      current.score += 1;
    }
    if (vote.value === -1) {
      current.dislikes += 1;
      current.score -= 1;
    }
    voteStatsByProject.set(vote.project_id, current);
  }

  const countryCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const completionCounts = new Map<"starter" | "growing" | "complete", number>([["starter", 0], ["growing", 0], ["complete", 0]]);

  const completionScores = profiles.map((profile) => {
    const score = getProfileCompletionScore(profile, profileSkillCountMap, profileLanguageCountMap, profileEducationCountMap, profileCertificateCountMap, profileQaCountMap, profileWorkExperienceCountMap);
    const band = score >= 80 ? "complete" : score >= 45 ? "growing" : "starter";
    completionCounts.set(band, (completionCounts.get(band) || 0) + 1);

    if (profile.country_id && countryMap.get(profile.country_id)) {
      const countryName = countryMap.get(profile.country_id) as string;
      countryCounts.set(countryName, (countryCounts.get(countryName) || 0) + 1);
    }
    if (profile.category_id && categoryMap.get(profile.category_id)) {
      const categoryName = categoryMap.get(profile.category_id) as string;
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
    }
    return score;
  });

  const combinedSkillCounts = new Map<string, number>();
  for (const relation of [...projectSkills, ...profileSkills]) {
    const name = getRelationName(relation.skills);
    if (!name) continue;
    combinedSkillCounts.set(name, (combinedSkillCounts.get(name) || 0) + 1);
  }

  const profileMonthly = aggregateByMonth(profiles, monthKeys);
  const projectsMonthly = aggregateByMonth(projects, monthKeys);
  const votesMonthly = aggregateByMonth(votes, monthKeys);

  const topProjects = projects
    .map((project) => {
      const voteStats = voteStatsByProject.get(project.id) || { likes: 0, dislikes: 0, score: 0 };
      const ownerProfile = profileByUserId.get(project.owner_id);
      return {
        id: project.id,
        title: project.title,
        slug: project.slug,
        likes: voteStats.likes,
        dislikes: voteStats.dislikes,
        score: voteStats.score,
        ownerName: ownerProfile?.name || ownerProfile?.username || null,
        categoryName:
          ownerProfile?.category_id && categoryMap.get(ownerProfile.category_id)
            ? (categoryMap.get(ownerProfile.category_id) as string)
            : null,
      };
    })
    .sort((left, right) => right.score - left.score || right.likes - left.likes)
    .slice(0, 6);

  const averageProjectScore =
    projects.length > 0
      ? Math.round(projects.reduce((sum, project) => sum + (voteStatsByProject.get(project.id)?.score || 0), 0) / projects.length)
      : 0;

  const averageProfileCompletion =
    completionScores.length > 0
      ? Math.round(completionScores.reduce((sum, value) => sum + value, 0) / completionScores.length)
      : 0;

  return {
    siteTotals: {
      profiles: profiles.length,
      publicProfiles: profiles.filter((profile) => Boolean(profile.username)).length,
      countries: countryCounts.size,
      categories: categories.length,
      projects: projects.length,
      votes: votes.length,
      likes: votes.filter((vote) => vote.value === 1).length,
      dislikes: votes.filter((vote) => vote.value === -1).length,
      avgProfileCompletion: averageProfileCompletion,
      avgProjectScore: averageProjectScore,
    },
    monthlyActivity: monthKeys.map((key) => ({ key, profiles: profileMonthly.get(key) || 0, projects: projectsMonthly.get(key) || 0, votes: votesMonthly.get(key) || 0 })),
    statusBreakdown: [...statusCounts.entries()].map(([key, value]) => ({ key, value })).sort((left, right) => right.value - left.value),
    categoryBreakdown: [...categoryCounts.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value).slice(0, 8),
    countryBreakdown: [...countryCounts.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value).slice(0, 8),
    completionBreakdown: [...completionCounts.entries()].map(([key, value]) => ({ key, value })),
    topProjects,
    topSkills: [...combinedSkillCounts.entries()].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value).slice(0, 14),
  };
}
