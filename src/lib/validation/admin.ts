import { z } from "zod";

export const categorySchema = z.object({
  title: z.string().min(2).max(120),
  section: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999).optional(),
});

export const nomineeSchema = z.object({
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(120),
  known_name: z.string().min(1).max(120).optional().nullable(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  bio: z.string().max(4000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  social_links: z.record(z.string(), z.string()).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const updateNomineeSchema = nomineeSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const subcategorySchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  name: z.string().min(2).max(120),
});
export const updateSubcategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(120),
});
export const nomineeStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export const sponsorSchema = z.object({
  name: z.string().min(2).max(120),
  logo_url: z.string().url().optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  tier: z.string().min(2).max(40).optional(),
  sort_order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});
