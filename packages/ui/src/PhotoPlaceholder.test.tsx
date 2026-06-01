import { render, screen } from '@testing-library/react';
import { PhotoPlaceholder } from './PhotoPlaceholder';

describe('PhotoPlaceholder', () => {
  it('renders a decorative svg and an optional label', () => {
    const { container } = render(<PhotoPlaceholder seed={2} label="SEED 2" />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('SEED 2')).toBeInTheDocument();
  });
});
