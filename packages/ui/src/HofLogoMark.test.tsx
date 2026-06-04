import { render } from '@testing-library/react';
import { HofLogoMark } from './HofLogoMark';

describe('HofLogoMark', () => {
  it('renders the emblem image at the requested size', () => {
    const { container } = render(<HofLogoMark size={48} src="/assets/hof-emblem.png" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/assets/hof-emblem.png');
    expect(img?.style.height).toBe('48px');
    const wrap = container.querySelector('span');
    expect(wrap?.style.width).toBe('48px');
    expect(wrap?.style.height).toBe('48px');
  });
});
