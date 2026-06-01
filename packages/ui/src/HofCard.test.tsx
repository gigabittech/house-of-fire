import { render, screen } from '@testing-library/react';
import { HofCard } from './HofCard';

describe('HofCard', () => {
  it('renders children and forwards DOM props', () => {
    render(
      <HofCard data-testid="card">
        <span>Inside</span>
      </HofCard>,
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });
});
