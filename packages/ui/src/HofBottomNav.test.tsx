import { fireEvent, render, screen } from '@testing-library/react';
import { HofBottomNav } from './HofBottomNav';

describe('HofBottomNav', () => {
  it('renders all four destinations', () => {
    render(<HofBottomNav active="home" />);
    for (const label of ['Home', 'Events', 'Community', 'Profile']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('calls onChange with the tapped id', () => {
    const onChange = vi.fn();
    render(<HofBottomNav active="home" onChange={onChange} />);
    fireEvent.click(screen.getByText('Community'));
    expect(onChange).toHaveBeenCalledWith('community');
  });
});
