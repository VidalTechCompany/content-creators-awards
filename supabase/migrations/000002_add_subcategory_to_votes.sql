-- Add subcategory support for vote scoping.
-- This migration preserves category-level voting for categories without subcategories,
-- while allowing subcategory-specific voting for nominees assigned to a subcategory.

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS votes_subcategory_id_idx ON public.votes (subcategory_id);

ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_user_id_category_id_key;

ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_fingerprint_category_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS votes_user_scope_idx
  ON public.votes ((coalesce(subcategory_id, category_id)), user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS votes_fingerprint_scope_idx
  ON public.votes ((coalesce(subcategory_id, category_id)), fingerprint)
  WHERE fingerprint IS NOT NULL;

-- Ensure that when a nominee is assigned to a subcategory, the vote's subcategory_id
-- must match the nominee's subcategory. For nominees without subcategories,
-- votes must be category-scoped (i.e. subcategory_id must be NULL).
CREATE OR REPLACE FUNCTION public.validate_vote_subcategory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nominee_sub uuid;
BEGIN
  SELECT subcategory_id INTO nominee_sub FROM public.nominees WHERE id = NEW.nominee_id;
  IF nominee_sub IS NOT NULL THEN
    IF NEW.subcategory_id IS DISTINCT FROM nominee_sub THEN
      RAISE EXCEPTION 'invalid_subcategory_for_nominee';
    END IF;
  ELSE
    IF NEW.subcategory_id IS NOT NULL THEN
      RAISE EXCEPTION 'cannot_vote_in_subcategory_for_nominee_without_subcategory';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_vote_subcategory ON public.votes;
CREATE TRIGGER trg_validate_vote_subcategory
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_vote_subcategory();
