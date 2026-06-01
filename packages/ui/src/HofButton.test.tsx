import { fireEvent, render, screen } from '@testing-library/react';
import { HofButton } from './HofButton';

describe('HofButton', () => {
  it('renders its label', () => {
    render(<HofButton>Get Tickets</HofButton>);
    expect(screen.getByRole('button', { name: 'Get Tickets' })).toBeInTheDocument();
  });

  it('fires onClick when enabled', () => {
    const onClick = vi.fn();
    render(<HofButton onClick={onClick}>Buy</HofButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <HofButton onClick={onClick} disabled>
        Sold out
      </HofButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
