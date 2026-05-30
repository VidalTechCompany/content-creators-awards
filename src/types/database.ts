export type AdminRole = "super_admin" | "moderator";

export type NomineeStatus = "pending" | "approved" | "rejected";

export type SubcategoryRow = {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  title: string;
  section: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  subcategories?: SubcategoryRow[];
};

export type NomineeRow = {
  id: string;
  category_id: string;
  subcategory_id?: string | null;
  name: string;
  known_name?: string | null;
  slug: string;
  bio: string | null;
  image_url: string | null;
  social_links: Record<string, string>;
  status: NomineeStatus;
  created_at: string;
  updated_at: string;
};

export type NomineeStatRow = {
  nominee_id: string;
  vote_count: number;
};

export type SponsorRow = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sort_order: number;
  active: boolean;
};

export type SiteSettingsRow = {
  id: number;
  voting_deadline: string | null;
  voting_open: boolean;
  extra: Record<string, unknown>;
};
