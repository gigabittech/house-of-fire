import type { Meta, StoryObj } from '@storybook/react';
import { HofBottomNav } from './HofBottomNav';

const meta: Meta<typeof HofBottomNav> = {
  title: 'Navigation/HofBottomNav',
  component: HofBottomNav,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 120, width: 390, background: '#0A0A08' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof HofBottomNav>;

export const Home: Story = { args: { active: 'home' } };
export const Community: Story = { args: { active: 'community' } };
