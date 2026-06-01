import { render } from '@testing-library/react';
import { FakeQR } from './FakeQR';

describe('FakeQR', () => {
  it('renders a 25×25 module grid (625 cells)', () => {
    const { container } = render(<FakeQR size={250} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.children.length).toBe(625);
  });

  it('is deterministic across renders', () => {
    const a = render(<FakeQR />).container.innerHTML;
    const b = render(<FakeQR />).container.innerHTML;
    expect(a).toBe(b);
  });
});
