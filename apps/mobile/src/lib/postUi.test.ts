import { describe, expect, it } from 'vitest';
import { apiPostToUi, parseReactions } from './postUi';

describe('postUi', () => {
  const basePost = {
    id: 'p1',
    channel: 'general',
    title: 'Hello',
    body: 'World',
    is_anonymous: false,
    reply_count: 2,
    reaction_counts: { fire: 3, invalid: 99 },
    moderation_status: 'pending' as const,
    moderation_note: 'Needs edit',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    profiles: {
      handle: 'alex',
      display_name: 'Alex',
      role: 'member',
      avatar_url: null,
    },
  };

  it('maps api post to ui post with moderation fields', () => {
    const ui = apiPostToUi(basePost, { myReactions: ['fire'] });
    expect(ui.moderationStatus).toBe('pending');
    expect(ui.moderationNote).toBe('Needs edit');
    expect(ui.myReactions).toEqual(['fire']);
    expect(ui.reactions?.fire).toBe(3);
  });

  it('parses only valid reaction keys', () => {
    expect(parseReactions({ fire: 1, bogus: 5 })).toEqual({ fire: 1 });
  });

  it('uses Anonymous for anonymous posts', () => {
    const ui = apiPostToUi({ ...basePost, is_anonymous: true });
    expect(ui.author.name).toBe('Anonymous');
  });
});
