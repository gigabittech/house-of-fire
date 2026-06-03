-- Moderation, FAQs, comp pools

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'draft'));

CREATE TABLE IF NOT EXISTS content_reports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  post_id     uuid REFERENCES posts(id) ON DELETE CASCADE,
  reply_id    uuid REFERENCES replies(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE discount_codes
  ADD COLUMN IF NOT EXISTS pool text CHECK (pool IS NULL OR pool IN ('crew', 'press', 'goodwill'));

CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
