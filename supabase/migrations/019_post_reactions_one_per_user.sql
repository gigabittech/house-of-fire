-- One active reaction per user per post (changeable via UPDATE).

-- Keep the newest row when a user has multiple emoji reactions on the same post.
DELETE FROM public.post_reactions pr
WHERE pr.id NOT IN (
  SELECT DISTINCT ON (post_id, user_id) id
  FROM public.post_reactions
  ORDER BY post_id, user_id, id DESC
);

ALTER TABLE public.post_reactions
  DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_emoji_key;

ALTER TABLE public.post_reactions
  DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key;

ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_post_id_user_id_key UNIQUE (post_id, user_id);

DROP TRIGGER IF EXISTS on_post_reaction_change ON public.post_reactions;
CREATE TRIGGER on_post_reaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_post_reaction_counts();
