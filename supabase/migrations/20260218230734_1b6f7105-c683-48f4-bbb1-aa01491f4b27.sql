-- Add AI provider and model tracking columns to captures
ALTER TABLE public.captures ADD COLUMN IF NOT EXISTS ai_provider text;
ALTER TABLE public.captures ADD COLUMN IF NOT EXISTS ai_model text;