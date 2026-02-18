
CREATE TABLE public.ai_second_opinions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  compiled_context TEXT NOT NULL,
  instruction TEXT,
  response TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_second_opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read second opinions"
ON public.ai_second_opinions
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert second opinions"
ON public.ai_second_opinions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public delete second opinions"
ON public.ai_second_opinions
FOR DELETE
USING (true);

CREATE INDEX idx_second_opinions_project_id ON public.ai_second_opinions (project_id);
