import type { Meta, StoryObj } from '@storybook/react';
import { ReactionStrip } from './ReactionStrip';
import type { Post } from './types';

const meta: Meta<typeof ReactionStrip> = {
  title: 'Feed/ReactionStrip',
  component: ReactionStrip,
};
export default meta;

const base: Post = {
  id: 'demo',
  channel: 'general',
  kind: 'quick',
  author: { name: 'Jordan', initials: 'JG', role: 'crew' },
  time: '2h',
  replyCount: 0,
};

export const WithReactions: StoryObj<typeof ReactionStrip> = {
  args: { post: { ...base, reactions: { fire: 52, heart: 12, pray: 4 }, myReaction: 'fire' } },
};

export const Empty: StoryObj<typeof ReactionStrip> = {
  args: { post: { ...base, reactions: {} } },
};
