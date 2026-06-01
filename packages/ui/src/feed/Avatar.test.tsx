import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders the initials', () => {
    render(<Avatar initials="JG" userRole="crew" />);
    expect(screen.getByText('JG')).toBeInTheDocument();
  });
});
