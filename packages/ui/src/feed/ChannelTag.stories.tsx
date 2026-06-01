import type { Meta, StoryObj } from '@storybook/react';
import { ChannelTag } from './ChannelTag';

const meta: Meta<typeof ChannelTag> = {
  title: 'Feed/ChannelTag',
  component: ChannelTag,
};
export default meta;

type Story = StoryObj<typeof ChannelTag>;

export const General: Story = { args: { id: 'general' } };
export const Lineup: Story = { args: { id: 'lineup' } };
