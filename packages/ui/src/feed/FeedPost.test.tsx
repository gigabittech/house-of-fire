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
  title: 'Theme 24 lineup is final',
  body: 'Headliner reveal.',
  reactions: { fire: 52 },
  replyCount: 7,
  pinned: true,
};

describe('FeedPost', () => {
  it('renders title, channel, crew badge, and reply count', () => {
    render(<FeedPost post={announcement} />);
    expect(screen.getByText('Theme 24 lineup is final')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
    expect(screen.getByText('Crew')).toBeInTheDocument();
    expect(screen.getByText('7 replies')).toBeInTheDocument();
  });

  it('fires onOpen when tapped', () => {
    const onOpen = vi.fn();
    render(<FeedPost post={announcement} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('Theme 24 lineup is final'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('fires onOpen when the reply count is tapped', () => {
    const onOpen = vi.fn();
    render(<FeedPost post={announcement} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('7 replies'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('resolves recap photos through the provided resolver', () => {
    const recap: Post = { ...announcement, kind: 'recap', photoSeeds: [0, 1, 2, 3] };
    const resolvePhoto = (seed: number) => `/assets/photos/p${seed + 1}.jpg`;
    const { container } = render(<FeedPost post={recap} resolvePhoto={resolvePhoto} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(4);
  });

  it('shows React (N) by default instead of per-reaction chips', () => {
    render(<FeedPost post={announcement} />);
    expect(screen.getByText('React (52)')).toBeInTheDocument();
    expect(screen.queryByText('52')).not.toBeInTheDocument();
  });

  it('shows React (N) when collapsed even without interactive reactions', () => {
    const post: Post = {
      ...announcement,
      reactions: { heart: 1, music: 1 },
    };
    render(<FeedPost post={post} />);

    expect(screen.getByText('React (2)')).toBeInTheDocument();
  });

  it('opens the reaction picker directly when React (N) is clicked', () => {
    const post: Post = {
      ...announcement,
      reactions: { heart: 2, pray: 1 },
      myReaction: 'heart',
    };
    render(<FeedPost post={post} interactiveReactions onReact={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'React (3)' })).toBeInTheDocument();
    expect(screen.queryByTitle(/React with/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'React (3)' }));

    expect(screen.getByRole('button', { name: 'React (3)' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTitle('Remove your reaction')).toBeInTheDocument();
    expect(screen.getByTitle('React with 🙏')).toBeInTheDocument();
  });

  it('toggles the reaction picker closed when React (N) is clicked again', () => {
    const post: Post = {
      ...announcement,
      reactions: { heart: 2, pray: 1 },
      myReaction: 'heart',
    };
    render(<FeedPost post={post} interactiveReactions onReact={vi.fn()} />);

    const reactButton = screen.getByRole('button', { name: 'React (3)' });
    fireEvent.click(reactButton);
    expect(screen.getByTitle('Remove your reaction')).toBeInTheDocument();

    fireEvent.click(reactButton);
    expect(screen.queryByTitle(/React with/)).not.toBeInTheDocument();
    expect(reactButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates the React (N) count when reactions change', () => {
    const post: Post = {
      ...announcement,
      reactions: { heart: 2, pray: 1 },
      myReaction: 'heart',
    };
    const { rerender } = render(
      <FeedPost post={post} interactiveReactions onReact={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React (3)' }));

    rerender(
      <FeedPost
        post={{ ...post, reactions: { heart: 2, pray: 1, fire: 1 } }}
        interactiveReactions
        onReact={vi.fn()}
      />,
    );

    expect(screen.getByText('React (4)')).toBeInTheDocument();
  });

  it('resets to collapsed React (N) when the post changes', () => {
    const postA: Post = {
      ...announcement,
      id: 'post-a',
      reactions: { heart: 2, pray: 1 },
    };
    const postB: Post = {
      ...announcement,
      id: 'post-b',
      reactions: { fire: 1 },
    };

    const { rerender } = render(
      <FeedPost post={postA} interactiveReactions onReact={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React (3)' }));
    expect(screen.getByTitle('React with 🔥')).toBeInTheDocument();

    rerender(<FeedPost post={postB} interactiveReactions onReact={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'React (1)' })).toBeInTheDocument();
    expect(screen.queryByTitle(/React with/)).not.toBeInTheDocument();
  });
});
