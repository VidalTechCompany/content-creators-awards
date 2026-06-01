BEGIN;

-- Create gendered TikTok dance subcategories if they do not already exist.
INSERT INTO public.subcategories (category_id, name)
SELECT c.id, 'Best Male Dancer'
FROM public.categories c
WHERE c.slug = 'tiktok'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, 'Best Female Dancer'
FROM public.categories c
WHERE c.slug = 'tiktok'
ON CONFLICT (category_id, name) DO NOTHING;

DO $$
DECLARE
    tiktok_id uuid;
    old_dance_id uuid;
    male_sub_id uuid;
    female_sub_id uuid;
BEGIN
    -- Get the TikTok category ID
    SELECT id INTO tiktok_id FROM public.categories WHERE slug = 'tiktok';
    
    -- Get subcategory IDs
    SELECT id INTO old_dance_id FROM public.subcategories 
    WHERE category_id = tiktok_id 
      AND (name ILIKE '%dancer creator%' OR name ILIKE '%dance creator%');
    
    SELECT id INTO male_sub_id FROM public.subcategories 
    WHERE category_id = tiktok_id AND name = 'Best Male Dancer';
    
    SELECT id INTO female_sub_id FROM public.subcategories 
    WHERE category_id = tiktok_id AND name = 'Best Female Dancer';
    
    -- Only proceed if we found all required subcategories
    IF old_dance_id IS NOT NULL AND male_sub_id IS NOT NULL AND female_sub_id IS NOT NULL THEN
        
        -- Update nominees: move male/female to appropriate subcategories
        UPDATE public.nominees n
        SET subcategory_id = CASE
            WHEN lower(coalesce(n.known_name, n.name)) ~ '\m(female|woman|girl|she|her)\M' THEN female_sub_id
            WHEN lower(coalesce(n.known_name, n.name)) ~ '\m(male|man|boy|he|him)\M' THEN male_sub_id
            ELSE n.subcategory_id
        END
        WHERE n.subcategory_id = old_dance_id
          AND (
              lower(coalesce(n.known_name, n.name)) ~ '\m(female|woman|girl|she|her)\M'
              OR lower(coalesce(n.known_name, n.name)) ~ '\m(male|man|boy|he|him)\M'
          );
        
        -- Update votes to point to new subcategory IDs
        UPDATE public.votes v
        SET subcategory_id = n.subcategory_id
        FROM public.nominees n
        WHERE v.nominee_id = n.id
          AND v.subcategory_id = old_dance_id
          AND n.subcategory_id IN (male_sub_id, female_sub_id);
        
        RAISE NOTICE 'Migration completed successfully. Migrated from subcategory % to Male(%) and Female(%)', 
            old_dance_id, male_sub_id, female_sub_id;
    ELSE
        RAISE NOTICE 'Required subcategories not found. old_dance_id: %, male_sub_id: %, female_sub_id: %', 
            old_dance_id, male_sub_id, female_sub_id;
    END IF;
END $$;

COMMIT;