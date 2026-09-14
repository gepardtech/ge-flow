CREATE TABLE IF NOT EXISTS public.server_kv (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.server_kv TO service_role;

ALTER TABLE public.server_kv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages server storage"
  ON public.server_kv FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);