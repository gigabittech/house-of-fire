import { render, screen } from '@testing-library/react';
import { ReactionStrip } from './ReactionStrip';
import type { Post } from './types';

const base: Post = {
  id: 'demo',
  channel: 'general',
  kind: 'quick',
  author: { name: 'Jordan', initials: 'JG', role: 'crew' },
  time: '2h',
  replyCount: 0,
};

describe('ReactionStrip', () => {
  it('shows per-type reaction counts', () => {
    render(<ReactionStrip post={{ ...base, reactions: { fire: 52, heart: 12, pray: 4 } }} />);
    expect(screen.getByText('52')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('highlights the viewer reaction', () => {
    render(
      <ReactionStrip
        post={{ ...base, reactions: { fire: 3, heart: 2 }, myReaction: 'heart' }}
      />,
    );
    expect(screen.getByTitle('Your reaction')).toBeInTheDocument();
  });

  it('invites the first reaction when empty', () => {
    render(<ReactionStrip post={{ ...base, reactions: {} }} />);
    expect(screen.getByText('Be the first to react')).toBeInTheDocument();
  });
});
