import type { Meta, StoryObj } from '@storybook/react';
import { HofCard } from './HofCard';

const meta: Meta<typeof HofCard> = {
  title: 'UI/HofCard',
  component: HofCard,
};
export default meta;

type Story = StoryObj<typeof HofCard>;

export const Default: Story = {
  args: {
    children: <span style={{ color: '#F0EDE6' }}>A warm dark panel.</span>,
    style: { width: 280 },
  },
};
