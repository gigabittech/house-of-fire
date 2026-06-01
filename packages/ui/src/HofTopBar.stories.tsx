import type { Meta, StoryObj } from '@storybook/react';
import { HofTopBar } from './HofTopBar';

const meta: Meta<typeof HofTopBar> = {
  title: 'Navigation/HofTopBar',
  component: HofTopBar,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 120, width: 390, background: '#0A0A08' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof HofTopBar>;

export const WithTitle: Story = { args: { title: 'Event details' } };
export const Transparent: Story = { args: { title: 'Checkout', transparent: true } };
