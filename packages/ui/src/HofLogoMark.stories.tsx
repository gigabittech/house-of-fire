import type { Meta, StoryObj } from '@storybook/react';
import { HofLogoMark } from './HofLogoMark';

const meta: Meta<typeof HofLogoMark> = {
  title: 'Brand/HofLogoMark',
  component: HofLogoMark,
};
export default meta;

type Story = StoryObj<typeof HofLogoMark>;

export const Default: Story = { args: { size: 90 } };
