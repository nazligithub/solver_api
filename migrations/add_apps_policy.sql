-- Enable RLS (if not already enabled)
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone
CREATE POLICY "Allow public read access on apps" ON public.apps
FOR SELECT
TO public
USING (true);

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON public.apps
FOR ALL
TO service_role
USING (true);