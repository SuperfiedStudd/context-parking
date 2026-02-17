
-- Add status column to captures table
ALTER TABLE public.captures ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Index for filtering
CREATE INDEX idx_captures_status ON public.captures (status);

-- Allow anon to update status field only (for promote action)
CREATE POLICY "Allow public update status"
ON public.captures
FOR UPDATE
USING (true)
WITH CHECK (true);
