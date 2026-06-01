import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders an svg at the requested size', () => {
    const { container } = render(<Icon name="flame" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('applies the provided color to stroked icons', () => {
    const { container } = render(<Icon name="home" color="#E8651A" />);
    const stroked = container.querySelector('[stroke="#E8651A"]');
    expect(stroked).not.toBeNull();
  });
});
