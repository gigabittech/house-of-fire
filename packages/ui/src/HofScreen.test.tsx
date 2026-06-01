import { render, screen } from '@testing-library/react';
import { HofScreen, HofScroll } from './HofScreen';

describe('HofScreen', () => {
  it('renders children inside a scroll region', () => {
    render(
      <HofScreen>
        <HofScroll>
          <span>Body content</span>
        </HofScroll>
      </HofScreen>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});
