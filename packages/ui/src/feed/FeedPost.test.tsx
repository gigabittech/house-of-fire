import { fireEvent, render, screen } from '@testing-library/react';
import { FeedPost } from './FeedPost';
import type { Post } from './types';

const announcement: Post = {
  id: 'p1',
  channel: 'general',
  kind: 'announcement',
  author: { name: 'Jordan', initials: 'JG', role: 'crew' },
  time: '2h',
  edition: 24,
  title: 'Edition 24 lineup is final',
  body: 'Headliner reveal.',
  reactions: { fire: 52 },
  replyCount: 7,
  pinned: true,
};

describe('FeedPost', () => {
  it('renders title, channel, crew badge, and reply count', () => {
    render(<FeedPost post={announcement} />);
    expect(screen.getByText('Edition 24 lineup is final')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
    expect(screen.getByText('Crew')).toBeInTheDocument();
    expect(screen.getByText('7 replies')).toBeInTheDocument();
  });

  it('fires onOpen when tapped', () => {
    const onOpen = vi.fn();
    render(<FeedPost post={announcement} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('Edition 24 lineup is final'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('resolves recap photos through the provided resolver', () => {
    const recap: Post = { ...announcement, kind: 'recap', photoSeeds: [0, 1, 2, 3] };
    const resolvePhoto = (seed: number) => `/assets/photos/p${seed + 1}.jpg`;
    const { container } = render(<FeedPost post={recap} resolvePhoto={resolvePhoto} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(4);
  });
});
