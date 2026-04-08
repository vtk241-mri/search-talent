import { z } from "zod";

export const projectVoteSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const profileVoteSchema = z.object({
  profileId: z.string().uuid("Invalid profile id"),
  value: z.union([z.literal(1), z.literal(-1)]),
});
