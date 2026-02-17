
-- Add strategic_forks and deferred_decisions columns
ALTER TABLE public.captures ADD COLUMN strategic_forks jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.captures ADD COLUMN deferred_decisions jsonb DEFAULT '[]'::jsonb;

-- Migrate existing alternatives data into strategic_forks
UPDATE public.captures
SET strategic_forks = alternatives
WHERE alternatives IS NOT NULL AND alternatives != 'null'::jsonb;
