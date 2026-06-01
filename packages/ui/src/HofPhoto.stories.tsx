import type { Meta, StoryObj } from '@storybook/react';
import { HofPhoto } from './HofPhoto';

const meta: Meta<typeof HofPhoto> = {
  title: 'Media/HofPhoto',
  component: HofPhoto,
};
export default meta;

type Story = StoryObj<typeof HofPhoto>;

export const WithLabel: Story = {
  args: {
    src: '/assets/photos/p1-laser-dj.jpg',
    caption: 'Lasers & Lace',
    label: 'ED 24 · 001',
    style: { width: 240, height: 320, borderRadius: 10 },
  },
};
