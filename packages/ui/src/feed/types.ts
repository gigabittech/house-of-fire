// Shared community/feed data model (ported from posts-data.jsx).

export type ReactionKey = 'fire' | 'heart' | 'pray' | 'music' | 'eyes';
export type PostKind = 'announcement' | 'recap' | 'quick';
export type UserRole = 'crew' | 'member';

export interface PostAuthor {
  name: string;
  initials: string;
  role: UserRole;
  verified?: boolean;
  avatarUrl?: string | null;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'draft';

export interface Post {
  id: string;
  channel: string;
  kind: PostKind;
  author: PostAuthor;
  time: string;
  edition?: number;
  title?: string;
  body?: string;
  photoSeeds?: number[];
  imageUrls?: string[];
  reactions?: Partial<Record<ReactionKey, number>>;
  myReaction?: ReactionKey | null;
  myReactions?: ReactionKey[];
  replyCount: number;
  pinned?: boolean;
  moderationStatus?: ModerationStatus;
  moderationNote?: string;
}

export interface Channel {
  id: string;
  name: string;
  desc: string;
  pinned?: boolean;
  locked?: boolean;
}

export interface Reply {
  author: PostAuthor;
  time: string;
  body: string;
  replyTo?: string;
}
