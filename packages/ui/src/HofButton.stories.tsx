import type { Meta, StoryObj } from '@storybook/react';
import { HofButton } from './HofButton';

const meta: Meta<typeof HofButton> = {
  title: 'UI/HofButton',
  component: HofButton,
};
export default meta;

type Story = StoryObj<typeof HofButton>;

export const Primary: Story = { args: { children: 'Get Tickets', variant: 'primary' } };
export const Ghost: Story = { args: { children: 'Event details', variant: 'ghost' } };
export const Gold: Story = { args: { children: 'VIP', variant: 'gold' } };
export const Danger: Story = { args: { children: 'Cancel order', variant: 'danger' } };
export const Quiet: Story = { args: { children: 'Maybe later', variant: 'quiet' } };
export const Disabled: Story = { args: { children: 'Sold out', disabled: true } };

export const Sizes: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <HofButton size="lg">Large</HofButton>
      <HofButton size="md">Medium</HofButton>
      <HofButton size="sm">Small</HofButton>
    </div>
  ),
};
