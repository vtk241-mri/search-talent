export type Project = {
  id: string;
  owner_id: string;

  title: string;
  slug: string;
  description: string | null;

  tech_stack: string[] | null;

  likes_count: number;
  dislikes_count: number;
  views: number;

  status: string;
};
