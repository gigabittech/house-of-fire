import type { Meta, StoryObj } from '@storybook/react';
import { FeedPost } from './FeedPost';
import type { Post } from './types';

const meta: Meta<typeof FeedPost> = {
  title: 'Feed/FeedPost',
  component: FeedPost,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

const announcement: Post = {
  id: 'p1',
  channel: 'general',
  kind: 'announcement',
  author: { name: 'Jordan', initials: 'JG', role: 'crew' },
  time: '2h',
  edition: 24,
  title: 'Edition 24 lineup is final',
  body: 'Headliner reveal: HEX takes the 12:00 slot. Doors at 8 sharp — we open the floor at 9.',
  reactions: { fire: 52, heart: 12, pray: 4 },
  myReaction: null,
  replyCount: 7,
  pinned: true,
};

const recap: Post = {
  id: 'p2',
  channel: 'recap',
  kind: 'recap',
  author: { name: 'Crew', initials: 'CR', role: 'crew' },
  time: '3d',
  edition: 23,
  title: 'Edition 23 recap is up',
  body: '127 photos from the night by Mauro. Tag yourself — visible to members only.',
  photoSeeds: [0, 1, 2, 3],
  reactions: { fire: 184, heart: 41, music: 19 },
  myReaction: 'fire',
  replyCount: 21,
};

export const Announcement: StoryObj<typeof FeedPost> = { args: { post: announcement } };
export const Recap: StoryObj<typeof FeedPost> = { args: { post: recap } };
