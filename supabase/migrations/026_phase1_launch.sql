-- Phase 1 launch: dress code, event visibility, receipt resend audit trail.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_events_visibility_status_edition
  ON public.events (visibility, status, edition_number DESC);

-- Aggregated purchasable remaining tickets for an event (excludes hidden tiers).
CREATE OR REPLACE FUNCTION public.event_purchasable_remaining(p_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN tt.status = 'hidden' THEN 0::bigint
      WHEN tt.status = 'sold_out' THEN 0::bigint
      ELSE GREATEST(
        0::bigint,
        tt.capacity::bigint - COALESCE(sold.c, 0)::bigint
      )
    END
  ), 0)::bigint
  FROM public.ticket_tiers tt
  LEFT JOIN (
    SELECT tier_id, COUNT(*)::int AS c
    FROM public.tickets
    WHERE event_id = p_event_id
      AND status IN ('valid', 'used')
    GROUP BY tier_id
  ) sold ON sold.tier_id = tt.id
  WHERE tt.event_id = p_event_id;
$$;

-- True when every non-hidden tier is sold out (and at least one purchasable tier exists).
CREATE OR REPLACE FUNCTION public.event_is_sold_out(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ticket_tiers tt
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.ticket_tiers tt
    LEFT JOIN (
      SELECT tier_id, COUNT(*)::int AS c
      FROM public.tickets
      WHERE event_id = p_event_id
        AND status IN ('valid', 'used')
      GROUP BY tier_id
    ) sold ON sold.tier_id = tt.id
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
      AND tt.status <> 'sold_out'
      AND GREATEST(0, tt.capacity - COALESCE(sold.c, 0)) > 0
  );
$$;

CREATE OR REPLACE FUNCTION public.event_display_status(
  p_status text,
  p_visibility text,
  p_event_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(p_visibility, 'public') = 'hidden' THEN 'hidden'
    WHEN p_status = 'live' THEN 'live'
    WHEN public.event_is_sold_out(p_event_id) THEN 'sold_out'
    WHEN p_status = 'upcoming' THEN 'upcoming'
    ELSE 'upcoming'
  END;
$$;

-- Receipt / ticket email resend audit (actor + source for compliance).
CREATE TABLE IF NOT EXISTS public.email_resend_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  email_log_id uuid REFERENCES public.email_logs(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'member', 'system')),
  recipient text NOT NULL,
  source text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS email_resend_audit_order_id_idx
  ON public.email_resend_audit (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_resend_audit_created_at_idx
  ON public.email_resend_audit (created_at DESC);

ALTER TABLE public.email_resend_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_public_access_email_resend_audit"
ON public.email_resend_audit
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);
