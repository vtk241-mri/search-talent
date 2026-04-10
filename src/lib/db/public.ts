import { isPublicModerationStatus } from "@/lib/moderation";
import { unstable_noStore as noStore } from "next/cache";
import {
  normalizeProjectMediaItem,
  type ProjectMediaItem,
} from "@/lib/project-media";
import { parseProjectPath } from "@/lib/projects";
import {
  type EmploymentType,
  type ExperienceLevel,
  type PreferredContactMethod,
  type ProfileVisibility,
  type WorkFormat,
} from "@/lib/profile-sections";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileVoteSummary } from "@/lib/db/profile-votes";
import { getProjectVoteSummary } from "@/lib/db/project-votes";
import {
  normalizeProfileSettings,
  type ProfilePresentation,
} from "@/lib/profile-presentation";

function getRelationName(
  relation: { name?: string | null } | Array<{ name?: string | null }> | null,
) {
  if (Array.isArray(relation)) {
    return relation[0]?.name || null;
  }

  return relation?.name || null;
}

type PublicProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  role: string | null;
  score: number | null;
  cover_url: string | null;
  project_status: string | null;
  team_size: number | null;
  project_url: string | null;
  repository_url: string | null;
  started_on: string | null;
  completed_on: string | null;
  problem: string | null;
  solution: string | null;
  results: string | null;
  created_at: string | null;
  moderation_status: string | null;
};

type PublicProfileRow = {
  id: string;
  user_id: string;
  username: string | null;
  name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  country_id: number | null;
  city: string | null;
  category_id: number | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  contact_email: string | null;
  telegram_username: string | null;
  phone: string | null;
  preferred_contact_method: PreferredContactMethod | null;
  experience_level: ExperienceLevel | null;
  experience_years: number | null;
  employment_types: EmploymentType[] | null;
  work_formats: WorkFormat[] | null;
  salary_expectations: string | null;
  salary_currency: string | null;
  additional_info: string | null;
  profile_visibility: unknown;
  moderation_status: string | null;
  email_verified: boolean;
};

export type PublicProjectPageData = {
  project: PublicProjectRow;
  owner: {
    id: string;
    userId: string;
    username: string | null;
    name: string | null;
    headline: string | null;
    avatarUrl: string | null;
    city: string | null;
    countryName: string | null;
  } | null;
  technologies: Array<{ id: number; name: string }>;
  media: ProjectMediaItem[];
  voteSummary: Awaited<ReturnType<typeof getProjectVoteSummary>>;
  isAuthenticated: boolean;
  isOwner: boolean;
};

export type PublicProfilePageData = {
  profile: PublicProfileRow & {
    visibility: ProfileVisibility;
    presentation: ProfilePresentation;
    countryName: string | null;
    categoryName: string | null;
  };
  technologies: Array<{ id: number; name: string }>;
  languages: Array<{ id: string; name: string; level: string | null }>;
  education: Array<{
    id: string;
    institution: string | null;
    degree: string | null;
    field_of_study: string | null;
    started_on: string | null;
    completed_on: string | null;
    description: string | null;
  }>;
  certificates: Array<{
    id: string;
    title: string | null;
    issuer: string | null;
    issued_on: string | null;
    credential_url: string | null;
    file_url: string | null;
    file_name: string | null;
  }>;
  qas: Array<{
    id: string;
    question: string | null;
    answer: string | null;
  }>;
  workExperience: Array<{
    id: string;
    company_name: string | null;
    position: string | null;
    started_year: number | null;
    ended_year: number | null;
    is_current: boolean | null;
    responsibilities: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    score: number | null;
    cover_url: string | null;
  }>;
  voteSummary: Awaited<ReturnType<typeof getProfileVoteSummary>>;
  isAuthenticated: boolean;
  isOwner: boolean;
};

export async function getPublicProjectPageData(
  routeValue: string,
): Promise<PublicProjectPageData | null> {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parsedRoute = parseProjectPath(routeValue);

  let projectQuery = supabase
    .from("projects")
    .select(
      "id, owner_id, title, slug, description, role, score, cover_url, project_status, team_size, project_url, repository_url, started_on, completed_on, problem, solution, results, created_at, moderation_status",
    )
    .limit(1);

  if (parsedRoute.id) {
    projectQuery = projectQuery.eq("id", parsedRoute.id);
  } else if (parsedRoute.slug) {
    projectQuery = projectQuery.eq("slug", parsedRoute.slug);
  } else {
    return null;
  }

  const { data: project } = await projectQuery.maybeSingle();

  if (!project) {
    return null;
  }

  const typedProject = project as PublicProjectRow;
  const isOwner = user?.id === typedProject.owner_id;

  if (!isOwner && !isPublicModerationStatus(typedProject.moderation_status)) {
    return null;
  }

  const [ownerResponse, skillsResponse, mediaResponse, voteSummary] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, username, name, headline, avatar_url, city, country_id")
        .eq("user_id", typedProject.owner_id)
        .maybeSingle(),
      supabase
        .from("project_skills")
        .select(
          `
          skill_id,
          skills (
            name
          )
        `,
        )
        .eq("project_id", typedProject.id),
      supabase
        .from("project_media")
        .select(
          "id, project_id, owner_id, url, storage_path, file_name, mime_type, file_size, media_kind, created_at",
        )
        .eq("project_id", typedProject.id)
        .order("created_at", { ascending: true }),
      getProjectVoteSummary(supabase, typedProject.id, user?.id),
    ]);

  const owner = ownerResponse.data;
  let countryName: string | null = null;

  if (owner?.country_id) {
    const { data: country } = await supabase
      .from("countries")
      .select("name")
      .eq("id", owner.country_id)
      .maybeSingle();

    countryName = country?.name || null;
  }

  return {
    project: typedProject,
    owner: owner
      ? {
          id: owner.id,
          userId: owner.user_id,
          username: owner.username || null,
          name: owner.name || null,
          headline: owner.headline || null,
          avatarUrl: owner.avatar_url || null,
          city: owner.city || null,
          countryName,
        }
      : null,
    technologies: ((skillsResponse.data || []) as Array<{
      skill_id: number;
      skills: { name?: string | null } | Array<{ name?: string | null }> | null;
    }>)
      .map((relation) => {
        const name = getRelationName(relation.skills);

        if (!name) {
          return null;
        }

        return {
          id: relation.skill_id,
          name,
        };
      })
      .filter((item): item is { id: number; name: string } => Boolean(item)),
    media: ((mediaResponse.data || []) as ProjectMediaItem[]).map((item) =>
      normalizeProjectMediaItem(item),
    ),
    voteSummary,
    isAuthenticated: Boolean(user),
    isOwner,
  };
}

export async function getPublicProfilePageData(
  username: string,
): Promise<PublicProfilePageData | null> {
  noStore();
  const supabase = await createClient();
  const dataClient = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, user_id, username, name, headline, bio, avatar_url, country_id, city, category_id, website, github, twitter, linkedin, contact_email, telegram_username, phone, preferred_contact_method, experience_level, experience_years, employment_types, work_formats, salary_expectations, salary_currency, additional_info, profile_visibility, moderation_status, email_verified",
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const typedProfile = profile as PublicProfileRow;
  const isOwner = user?.id === typedProfile.user_id;

  if (!isOwner && !isPublicModerationStatus(typedProfile.moderation_status)) {
    return null;
  }

  const [
    skillsResponse,
    languagesResponse,
    educationResponse,
    certificatesResponse,
    qasResponse,
    workExperienceResponse,
    projectsResponse,
    voteSummary,
    countryResponse,
    categoryResponse,
  ] = await Promise.all([
    dataClient
      .from("profile_skills")
      .select(
        `
        skill_id,
        skills (
          name
        )
      `,
      )
      .eq("profile_id", typedProfile.id),
    dataClient
      .from("profile_languages")
      .select(
        `
        id,
        proficiency_level,
        languages (
          name
        )
      `,
      )
      .eq("profile_id", typedProfile.id),
    dataClient
      .from("profile_education")
      .select(
        "id, institution, degree, field_of_study, started_on, completed_on, description",
      )
      .eq("profile_id", typedProfile.id)
      .order("started_on", { ascending: false }),
    dataClient
      .from("profile_certificates")
      .select("id, title, issuer, issued_on, credential_url, file_url, file_name")
      .eq("profile_id", typedProfile.id)
      .order("issued_on", { ascending: false }),
    dataClient
      .from("profile_qas")
      .select("id, question, answer")
      .eq("profile_id", typedProfile.id),
    dataClient
      .from("profile_work_experience")
      .select(
        "id, company_name, position, started_year, ended_year, is_current, responsibilities",
      )
      .eq("profile_id", typedProfile.id)
      .order("started_year", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title, slug, description, score, cover_url, moderation_status")
      .eq("owner_id", typedProfile.user_id)
      .order("created_at", { ascending: false }),
    getProfileVoteSummary(supabase, typedProfile.id, user?.id),
    typedProfile.country_id
      ? dataClient
          .from("countries")
          .select("name")
          .eq("id", typedProfile.country_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    typedProfile.category_id
      ? dataClient
          .from("profile_categories")
          .select("name")
          .eq("id", typedProfile.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profileSettings = normalizeProfileSettings(typedProfile.profile_visibility);

  return {
    profile: {
      ...typedProfile,
      visibility: {
        about: profileSettings.about,
        professionalDetails: profileSettings.professionalDetails,
        workExperience: profileSettings.workExperience,
        skills: profileSettings.skills,
        languages: profileSettings.languages,
        education: profileSettings.education,
        certificates: profileSettings.certificates,
        qa: profileSettings.qa,
        links: profileSettings.links,
      },
      presentation: profileSettings.presentation,
      countryName: countryResponse.data?.name || null,
      categoryName: categoryResponse.data?.name || null,
    },
    technologies: ((skillsResponse.data || []) as Array<{
      skill_id: number;
      skills: { name?: string | null } | Array<{ name?: string | null }> | null;
    }>)
      .map((relation) => {
        const name = getRelationName(relation.skills);

        if (!name) {
          return null;
        }

        return {
          id: relation.skill_id,
          name,
        };
      })
      .filter((item): item is { id: number; name: string } => Boolean(item)),
    languages: ((languagesResponse.data || []) as Array<{
      id: string;
      proficiency_level: string | null;
      languages: { name?: string | null } | Array<{ name?: string | null }> | null;
    }>)
      .map((item) => {
        const name = getRelationName(item.languages);

        if (!name) {
          return null;
        }

        return {
          id: item.id,
          name,
          level: item.proficiency_level,
        };
      })
      .filter((item): item is { id: string; name: string; level: string | null } =>
        Boolean(item),
      ),
    education: (educationResponse.data || []) as PublicProfilePageData["education"],
    certificates:
      (certificatesResponse.data || []) as PublicProfilePageData["certificates"],
    qas: (qasResponse.data || []) as PublicProfilePageData["qas"],
    workExperience:
      (workExperienceResponse.data || []) as PublicProfilePageData["workExperience"],
    projects: ((projectsResponse.data || []) as Array<{
      id: string;
      title: string;
      slug: string | null;
      description: string | null;
      score: number | null;
      cover_url: string | null;
      moderation_status: string | null;
    }>).filter((project) => isPublicModerationStatus(project.moderation_status)),
    voteSummary,
    isAuthenticated: Boolean(user),
    isOwner,
  };
}
