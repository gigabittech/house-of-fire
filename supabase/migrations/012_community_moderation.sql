-- Community moderation: rejected status, audit log, reaction count sync, report inserts

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_note text;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_moderation_status_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'draft', 'rejected'));

CREATE TABLE IF NOT EXISTS moderation_actions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action       text NOT NULL CHECK (action IN ('approved', 'rejected', 'hidden', 'deleted', 'pinned', 'unpinned')),
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_post_id ON moderation_actions(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Keep reaction_counts in sync when reactions are toggled
CREATE OR REPLACE FUNCTION public.sync_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  counts jsonb;
BEGIN
  SELECT jsonb_build_object(
    'fire',  count(*) FILTER (WHERE emoji = 'fire'),
    'eyes',  count(*) FILTER (WHERE emoji = 'eyes'),
    'heart', count(*) FILTER (WHERE emoji = 'heart'),
    'music', count(*) FILTER (WHERE emoji = 'music'),
    'pray',  count(*) FILTER (WHERE emoji = 'pray')
  ) INTO counts
  FROM public.post_reactions
  WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);

  UPDATE public.posts
  SET reaction_counts = counts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_reaction_change ON public.post_reactions;
CREATE TRIGGER on_post_reaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_post_reaction_counts();

-- Members can submit content reports
DROP POLICY IF EXISTS "authenticated_report_content" ON content_reports;
CREATE POLICY "authenticated_report_content"
  ON content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
