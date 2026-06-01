import { render, screen } from '@testing-library/react';
import { ChannelTag } from './ChannelTag';

describe('ChannelTag', () => {
  it('prefixes the channel id with #', () => {
    render(<ChannelTag id="lineup" />);
    expect(screen.getByText('#lineup')).toBeInTheDocument();
  });
});
