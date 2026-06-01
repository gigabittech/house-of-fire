import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Feed/Avatar',
  component: Avatar,
};
export default meta;

export const Roles: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar initials="JG" userRole="crew" size={40} />
      <Avatar initials="SB" userRole="member" size={40} />
    </div>
  ),
};
