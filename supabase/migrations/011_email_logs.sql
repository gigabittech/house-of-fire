-- Email logs for all Resend-based outbound emails (admin + mobile apps).
-- Tracks queued/sent/failed status and basic metadata for auditing.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'failed')),
  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text,
  app text NOT NULL CHECK (app IN ('mobile', 'admin')),
  kind text,
  project_id uuid REFERENCES public.events (id) ON DELETE SET NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  text_body text,
  html_body text,
  from_email text,
  reply_to text,
  error_message text,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs (status);
CREATE INDEX IF NOT EXISTS email_logs_project_id_idx ON public.email_logs (project_id);
CREATE INDEX IF NOT EXISTS email_logs_to_address_idx ON public.email_logs (to_address);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- No public access; admin routes use service-role keys.
CREATE POLICY "no_public_access_email_logs"
ON public.email_logs
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

