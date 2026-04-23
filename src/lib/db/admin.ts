import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ModerationStatus,
  ReportStatus,
  ReportTargetType,
} from "@/lib/moderation";

export type AdminOverviewStats = {
  totalUsers: number;
  totalAdmins: number;
  totalProfiles: number;
  totalProjects: number;
  totalArticles: number;
  openReports: number;
  urgentReports: number;
  newFeedback: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    adminsResponse,
    profilesResponse,
    projectsResponse,
    articlesResponse,
    openReportsResponse,
    urgentReportsResponse,
    feedbackResponse,
  ] = await Promise.all([
    supabase.from("platform_admins").select("user_id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "triaged"]),
    supabase
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "triaged"])
      .eq("priority", "urgent"),
    supabase.from("feedback").select("id", { count: "exact", head: true }),
  ]);

  let totalUsers = profilesResponse.count || 0;

  if (adminClient) {
    const { data: usersList } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (usersList && "total" in usersList && typeof usersList.total === "number") {
      totalUsers = usersList.total;
    }
  }

  return {
    totalUsers,
    totalAdmins: adminsResponse.count || 0,
    totalProfiles: profilesResponse.count || 0,
    totalProjects: projectsResponse.count || 0,
    totalArticles: articlesResponse.count || 0,
    openReports: openReportsResponse.count || 0,
    urgentReports: urgentReportsResponse.count || 0,
    newFeedback: feedbackResponse.count || 0,
  };
}

export type AdminUserRow = {
  userId: string;
  profileId: string | null;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  moderationStatus: ModerationStatus | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  isAdmin: boolean;
};

export type UsersListParams = {
  search?: string;
  role?: "all" | "admin" | "user";
  status?: "all" | ModerationStatus;
  page?: number;
  perPage?: number;
};

export type UsersListResult = {
  items: AdminUserRow[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  summary: {
    totalUsers: number;
    totalAdmins: number;
    newThisWeek: number;
  };
};

type AuthUser = {
  id: string;
  email: string | null | undefined;
  created_at: string | null | undefined;
  last_sign_in_at?: string | null | undefined;
};

type ProfileIndexRow = {
  id: string;
  user_id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  moderation_status: string | null;
  created_at: string | null;
};

function normalizeStatus(value: string | null | undefined): ModerationStatus | null {
  const allowed: ModerationStatus[] = [
    "approved",
    "under_review",
    "restricted",
    "removed",
  ];
  return allowed.includes(value as ModerationStatus)
    ? (value as ModerationStatus)
    : null;
}

export async function getAdminUsersList(
  params: UsersListParams = {},
): Promise<UsersListResult> {
  const {
    search = "",
    role = "all",
    status = "all",
    page = 1,
    perPage = 25,
  } = params;

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: adminRows } = await supabase
    .from("platform_admins")
    .select("user_id");
  const adminIds = new Set(
    (adminRows || []).map((row) => row.user_id as string).filter(Boolean),
  );

  let authUsers: AuthUser[] = [];
  let authTotal = 0;

  if (adminClient) {
    const { data } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    authUsers = (data?.users || []).map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }));
    authTotal = (data && "total" in data && typeof data.total === "number"
      ? data.total
      : authUsers.length) as number;
  }

  const { data: profileRowsData } = await supabase
    .from("profiles")
    .select(
      "id, user_id, name, username, avatar_url, moderation_status, created_at",
    );
  const profileRows = (profileRowsData || []) as ProfileIndexRow[];
  const profilesByUserId = new Map<string, ProfileIndexRow>();
  for (const row of profileRows) {
    profilesByUserId.set(row.user_id, row);
  }

  const combined: AdminUserRow[] = authUsers.length
    ? authUsers.map((user) => {
        const profile = profilesByUserId.get(user.id);
        return {
          userId: user.id,
          profileId: profile?.id || null,
          email: user.email || null,
          displayName: profile?.name || null,
          username: profile?.username || null,
          avatarUrl: profile?.avatar_url || null,
          moderationStatus: normalizeStatus(profile?.moderation_status),
          createdAt: user.created_at || profile?.created_at || null,
          lastSignInAt: user.last_sign_in_at || null,
          isAdmin: adminIds.has(user.id),
        };
      })
    : profileRows.map((profile) => ({
        userId: profile.user_id,
        profileId: profile.id,
        email: null,
        displayName: profile.name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        moderationStatus: normalizeStatus(profile.moderation_status),
        createdAt: profile.created_at,
        lastSignInAt: null,
        isAdmin: adminIds.has(profile.user_id),
      }));

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = combined.filter((row) => {
    if (role === "admin" && !row.isAdmin) return false;
    if (role === "user" && row.isAdmin) return false;

    if (status !== "all" && row.moderationStatus !== status) {
      if (!(status === "approved" && row.moderationStatus === null)) {
        return false;
      }
    }

    if (normalizedSearch) {
      const haystack = [row.displayName, row.username, row.email]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }

    return true;
  });

  filtered.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

  const total = filtered.length;
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * perPage;
  const items = filtered.slice(offset, offset + perPage);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = combined.filter((row) => {
    if (!row.createdAt) return false;
    return new Date(row.createdAt).getTime() >= weekAgo;
  }).length;

  return {
    items,
    total,
    page: safePage,
    perPage,
    hasMore: offset + items.length < total,
    summary: {
      totalUsers: authTotal || combined.length,
      totalAdmins: adminIds.size,
      newThisWeek,
    },
  };
}

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  actionType: string;
  previousStatus: ModerationStatus | null;
  nextStatus: ModerationStatus | null;
  reportStatus: ReportStatus | null;
  targetType: ReportTargetType;
  targetId: string | null;
  targetLabel: string;
  targetHref: string | null;
  actorLabel: string;
  actorUserId: string;
  note: string | null;
};

export type AuditLogParams = {
  action?: string | "all";
  target?: ReportTargetType | "all";
  limit?: number;
  before?: string | null;
};

export async function getAdminAuditLog(
  params: AuditLogParams = {},
): Promise<{ items: AuditLogEntry[]; hasMore: boolean }> {
  const { action = "all", target = "all", limit = 50, before = null } = params;

  const supabase = await createClient();

  let query = supabase
    .from("moderation_actions")
    .select(
      "id, created_at, action_type, previous_status, next_status, report_status, target_type, target_profile_id, target_project_id, target_article_id, actor_user_id, note",
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (action !== "all") {
    query = query.eq("action_type", action);
  }

  if (target !== "all") {
    query = query.eq("target_type", target);
  }

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { items: [], hasMore: false };
  }

  type ActionRow = {
    id: string;
    created_at: string;
    action_type: string;
    previous_status: string | null;
    next_status: string | null;
    report_status: string | null;
    target_type: ReportTargetType;
    target_profile_id: string | null;
    target_project_id: string | null;
    target_article_id: string | null;
    actor_user_id: string;
    note: string | null;
  };

  const rows = data as ActionRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const actorIds = Array.from(
    new Set(pageRows.map((row) => row.actor_user_id).filter(Boolean)),
  );
  const profileIds = Array.from(
    new Set(
      pageRows
        .map((row) => row.target_profile_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const projectIds = Array.from(
    new Set(
      pageRows
        .map((row) => row.target_project_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const articleIds = Array.from(
    new Set(
      pageRows
        .map((row) => row.target_article_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [actorsResponse, profilesResponse, projectsResponse, articlesResponse] =
    await Promise.all([
      actorIds.length
        ? supabase
            .from("profiles")
            .select("user_id, name, username")
            .in("user_id", actorIds)
        : Promise.resolve({ data: [] as { user_id: string; name: string | null; username: string | null }[] }),
      profileIds.length
        ? supabase
            .from("profiles")
            .select("id, name, username")
            .in("id", profileIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null; username: string | null }[] }),
      projectIds.length
        ? supabase
            .from("projects")
            .select("id, title, slug")
            .in("id", projectIds)
        : Promise.resolve({ data: [] as { id: string; title: string; slug: string | null }[] }),
      articleIds.length
        ? supabase
            .from("articles")
            .select("id, title, slug")
            .in("id", articleIds)
        : Promise.resolve({ data: [] as { id: string; title: string; slug: string }[] }),
    ]);

  const actorMap = new Map(
    (actorsResponse.data || []).map((row) => [
      row.user_id,
      row.name || (row.username ? `@${row.username}` : row.user_id),
    ]),
  );
  const profileMap = new Map(
    (profilesResponse.data || []).map((row) => [
      row.id,
      {
        label: row.name || (row.username ? `@${row.username}` : row.id),
        href: row.username ? `/u/${row.username}` : null,
      },
    ]),
  );
  const projectMap = new Map(
    (projectsResponse.data || []).map((row) => [
      row.id,
      {
        label: row.title,
        href: row.slug ? `/projects/${row.slug}` : null,
      },
    ]),
  );
  const articleMap = new Map(
    (articlesResponse.data || []).map((row) => [
      row.id,
      {
        label: row.title,
        href: row.slug ? `/articles/${row.slug}` : null,
      },
    ]),
  );

  const items: AuditLogEntry[] = pageRows.map((row) => {
    let targetId: string | null = null;
    let targetLabel = "—";
    let targetHref: string | null = null;

    if (row.target_type === "profile" && row.target_profile_id) {
      targetId = row.target_profile_id;
      const profile = profileMap.get(row.target_profile_id);
      targetLabel = profile?.label || row.target_profile_id;
      targetHref = profile?.href || null;
    } else if (row.target_type === "project" && row.target_project_id) {
      targetId = row.target_project_id;
      const project = projectMap.get(row.target_project_id);
      targetLabel = project?.label || row.target_project_id;
      targetHref = project?.href || null;
    } else if (row.target_type === "article" && row.target_article_id) {
      targetId = row.target_article_id;
      const article = articleMap.get(row.target_article_id);
      targetLabel = article?.label || row.target_article_id;
      targetHref = article?.href || null;
    }

    return {
      id: row.id,
      createdAt: row.created_at,
      actionType: row.action_type,
      previousStatus: normalizeStatus(row.previous_status),
      nextStatus: normalizeStatus(row.next_status),
      reportStatus: (row.report_status as ReportStatus) || null,
      targetType: row.target_type,
      targetId,
      targetLabel,
      targetHref,
      actorLabel: actorMap.get(row.actor_user_id) || row.actor_user_id,
      actorUserId: row.actor_user_id,
      note: row.note,
    };
  });

  return { items, hasMore };
}
