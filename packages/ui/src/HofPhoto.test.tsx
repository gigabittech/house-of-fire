import { render, screen } from '@testing-library/react';
import { HofPhoto } from './HofPhoto';

describe('HofPhoto', () => {
  it('uses caption as alt text and shows the label', () => {
    render(<HofPhoto src="/assets/photos/p1-laser-dj.jpg" caption="Lasers & Lace" label="ED 24" />);
    expect(screen.getByAltText('Lasers & Lace')).toBeInTheDocument();
    expect(screen.getByText('ED 24')).toBeInTheDocument();
  });
});
