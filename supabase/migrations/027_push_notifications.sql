-- Web push campaigns, per-device delivery tracking, and segmented recipient RPCs.

CREATE TABLE IF NOT EXISTS public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  segment text NOT NULL CHECK (segment IN ('all_members', 'event_attendees', 'vip_members')),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'completed', 'partial', 'failed')),
  target_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  expired_count integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS push_campaigns_created_at_idx
  ON public.push_campaigns (created_at DESC);

CREATE INDEX IF NOT EXISTS push_campaigns_status_idx
  ON public.push_campaigns (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'expired')),
  error_message text,
  attempt_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS push_deliveries_campaign_status_idx
  ON public.push_deliveries (campaign_id, status);

CREATE INDEX IF NOT EXISTS push_deliveries_subscription_idx
  ON public.push_deliveries (subscription_id);

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_public_access_push_campaigns"
ON public.push_campaigns
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "no_public_access_push_deliveries"
ON public.push_deliveries
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- True when profile has push notifications enabled (default on).
CREATE OR REPLACE FUNCTION public.profile_push_enabled(p_settings jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE((p_settings->>'push_notifications')::boolean, true);
$$;

CREATE OR REPLACE FUNCTION public.count_push_recipients(
  p_segment text,
  p_event_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.push_subscriptions ps
  INNER JOIN public.profiles p ON p.id = ps.user_id
  WHERE public.profile_push_enabled(p.settings)
    AND CASE
      WHEN p_segment = 'all_members' THEN true
      WHEN p_segment = 'event_attendees' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      ELSE false
    END;
$$;

CREATE OR REPLACE FUNCTION public.list_push_recipients(
  p_segment text,
  p_event_id uuid DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  subscription_id uuid,
  user_id uuid,
  endpoint text,
  p256dh text,
  auth_key text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.id AS subscription_id,
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth_key
  FROM public.push_subscriptions ps
  INNER JOIN public.profiles p ON p.id = ps.user_id
  WHERE public.profile_push_enabled(p.settings)
    AND (p_cursor_id IS NULL OR ps.id > p_cursor_id)
    AND CASE
      WHEN p_segment = 'all_members' THEN true
      WHEN p_segment = 'event_attendees' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      ELSE false
    END
  ORDER BY ps.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;
