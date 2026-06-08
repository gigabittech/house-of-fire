export type NotifKind = 'reply' | 'react' | 'crew' | 'mention' | 'photo' | 'moderation';

export interface NotifItem {
  kind: NotifKind;
  read: boolean;
  initials: string;
  name: string;
  action: string;
  target: string;
  time: string;
  postId?: string;
  highlight?: boolean;
}

export type ApiNotif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  link: string | null;
};

export function parsePostIdFromLink(link: string | null): string | undefined {
  if (!link) return undefined;
  const match = link.match(/\/community\/([0-9a-f-]{36})/i);
  return match?.[1];
}

export function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function apiNotifToItem(n: ApiNotif): NotifItem {
  let kind: NotifKind = 'react';
  let action = '';
  let name = n.title;
  let highlight = false;

  switch (n.type) {
    case 'reply':
      kind = 'reply';
      action = 'replied to';
      break;
    case 'react':
      kind = 'react';
      action = 'reacted to';
      break;
    case 'post_approved':
      kind = 'moderation';
      action = 'approved your post';
      name = 'Moderation';
      highlight = true;
      break;
    case 'post_rejected':
      kind = 'moderation';
      action = 'reviewed your post';
      name = 'Moderation';
      break;
    case 'ticket_purchased':
      kind = 'crew';
      action = '';
      break;
    default:
      if (n.type.includes('crew') || n.type.includes('announce')) {
        kind = 'crew';
        highlight = true;
      }
  }

  const initials =
    name
      .split(' ')
      .map((w) => w[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return {
    kind,
    read: n.read,
    initials,
    name,
    action,
    target: n.body ?? '',
    time: timeAgo(n.created_at),
    postId: parsePostIdFromLink(n.link),
    highlight,
  };
}
