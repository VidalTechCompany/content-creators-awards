import { z } from "zod";

export const voteRequestSchema = z.object({
  categoryId: z.string().uuid(),
  nomineeId: z.string().uuid(),
  fingerprint: z.string().min(8).max(512),
  captchaToken: z.string().min(1, "Captcha token is required"),
});

export type VoteRequestInput = z.infer<typeof voteRequestSchema>;
