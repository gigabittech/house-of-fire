import { fireEvent, render, screen } from '@testing-library/react';
import { HofTopBar } from './HofTopBar';

describe('HofTopBar', () => {
  it('renders the title and fires onBack', () => {
    const onBack = vi.fn();
    render(<HofTopBar title="Event details" onBack={onBack} />);
    expect(screen.getByText('Event details')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
