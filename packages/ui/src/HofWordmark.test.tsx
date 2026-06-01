import { render, screen } from '@testing-library/react';
import { HofWordmark } from './HofWordmark';

describe('HofWordmark', () => {
  it('renders with the default alt text', () => {
    render(<HofWordmark />);
    expect(screen.getByAltText('House of Fire')).toBeInTheDocument();
  });
});
