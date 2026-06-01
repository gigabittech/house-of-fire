import { render, screen } from '@testing-library/react';
import { HofPill } from './HofPill';

describe('HofPill', () => {
  it('renders its content', () => {
    render(<HofPill tone="warning">Selling Fast</HofPill>);
    expect(screen.getByText('Selling Fast')).toBeInTheDocument();
  });
});
