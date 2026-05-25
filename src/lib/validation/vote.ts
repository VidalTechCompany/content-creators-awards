import { z } from "zod";

export const voteRequestSchema = z.object({
  categoryId: z.string().uuid(),
  nomineeId: z.string().uuid(),
  fingerprint: z.string().min(8).max(512),
});

export type VoteRequestInput = z.infer<typeof voteRequestSchema>;
