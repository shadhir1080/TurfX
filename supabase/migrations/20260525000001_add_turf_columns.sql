-- Migration: Add rich turf fields and allow nullable owner_id for seed/demo turfs

-- Allow owner_id to be nullable (for system/demo turfs)
ALTER TABLE public.turfs ALTER COLUMN owner_id DROP NOT NULL;

-- Add new rich data columns
ALTER TABLE public.turfs
  ADD COLUMN IF NOT EXISTS sports text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timings text,
  ADD COLUMN IF NOT EXISTS amenities text[],
  ADD COLUMN IF NOT EXISTS rating numeric(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_24hours boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS coordinates jsonb;

-- Update RLS: allow reads on new columns (already covered by existing SELECT policy)
-- No RLS changes needed as SELECT * is already allowed for everyone
