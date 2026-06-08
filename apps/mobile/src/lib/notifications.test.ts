import { describe, expect, it } from 'vitest';
import { apiNotifToItem } from './notificationUi';

describe('apiNotifToItem', () => {
  it('maps post_approved notifications', () => {
    const item = apiNotifToItem({
      id: '1',
      type: 'post_approved',
      title: 'Post approved',
      body: 'My post preview',
      read: false,
      created_at: new Date().toISOString(),
      link: '/community/550e8400-e29b-41d4-a716-446655440000',
    });
    expect(item.kind).toBe('moderation');
    expect(item.action).toContain('approved');
    expect(item.postId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('maps reply notifications', () => {
    const item = apiNotifToItem({
      id: '2',
      type: 'reply',
      title: 'Jordan',
      body: 'Nice post',
      read: true,
      created_at: new Date().toISOString(),
      link: '/community/abc',
    });
    expect(item.kind).toBe('reply');
    expect(item.name).toBe('Jordan');
  });
});
