-- Security hardening (Supabase advisor findings, 2026-06-11):
-- 1. SECURITY DEFINER functions were executable by anon/authenticated via PostgREST
--    (Postgres grants EXECUTE to PUBLIC by default). admin_list_guests, admin_resolve_user_emails,
--    list_push_recipients etc. leaked PII / allowed state mutation with just the anon key.
--    Lock internal functions to service_role; keep only intentionally-public RPCs open.
-- 2. Pin search_path on flagged functions.
-- 3. Deny-all RLS policies for service-role-only tables that had RLS enabled but no policy.
-- 4. Default privileges: stop auto-granting EXECUTE to PUBLIC on future functions.

-- ─── 1. Lock internal functions to service_role ──────────────────────────────
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'admin_members_stats',
        'admin_list_members',
        'admin_list_guests',
        'admin_guests_tier_status',
        'admin_financials_list',
        'admin_event_ticket_stats',
        'admin_dashboard_event_metrics',
        'admin_list_events_with_stats',
        'admin_resolve_user_emails',
        'admin_email_log_stats',
        'list_admin_media_photos',
        'count_admin_media_photos',
        'list_push_recipients',
        'count_push_recipients',
        'profile_push_enabled',
        'adjust_post_reaction_counts',
        'adjust_tier_sold_count',
        'sync_tier_sold_count_for_tier',
        'sync_tier_sold_count_trigger',
        'sync_post_reaction_counts',
        'ticket_status_counts_toward_sold',
        'set_updated_at',
        'increment_reply_count',
        'increment_code_uses',
        'decrement_code_uses',
        'sync_discount_code_uses',
        'orders_discount_code_uses_trigger',
        'sync_event_capacity_from_tiers',
        'trg_ticket_tiers_sync_event_capacity',
        'handle_new_user',
        'rls_auto_enable',
        'user_event_ticket_count',
        'tier_available_count',
        'event_purchasable_remaining',
        'event_is_sold_out',
        'event_display_status'
      ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Intentionally public RPCs (unchanged): event_inventory_snapshot,
-- list_community_posts, list_post_replies, list_author_posts,
-- list_event_photos, count_event_photos, profile_author_reaction_totals.

-- is_crew_or_admin is referenced by RLS policies — must stay executable by
-- anon + authenticated (policy evaluation runs as the requesting role).
GRANT EXECUTE ON FUNCTION public.is_crew_or_admin() TO anon, authenticated;

-- ─── 2. Pin search_path on flagged functions ─────────────────────────────────
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'set_updated_at',
        'ticket_status_counts_toward_sold',
        'increment_reply_count',
        'profile_push_enabled'
      ])
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END $$;

-- ─── 3. Deny-all policies for service-role-only tables ───────────────────────
DROP POLICY IF EXISTS "no_public_access_door_check_in_scans" ON public.door_check_in_scans;
CREATE POLICY "no_public_access_door_check_in_scans"
ON public.door_check_in_scans
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'moderation_actions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "no_public_access_moderation_actions" ON public.moderation_actions';
    EXECUTE 'CREATE POLICY "no_public_access_moderation_actions"
      ON public.moderation_actions
      AS RESTRICTIVE
      FOR ALL
      TO public
      USING (false)
      WITH CHECK (false)';
  END IF;
END $$;

-- ─── 4. Future functions: no automatic PUBLIC execute ────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
