
CREATE TABLE public.captures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source text,
  chat_title text,
  raw_transcript text,
  summary text,
  objective text,
  alternatives jsonb,
  chosen_direction text,
  next_action text,
  resolved_to_project_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.captures
  FOR SELECT
  USING (true);
