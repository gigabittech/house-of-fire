import type { Meta, StoryObj } from '@storybook/react';
import { HofWordmark } from './HofWordmark';

const meta: Meta<typeof HofWordmark> = {
  title: 'Brand/HofWordmark',
  component: HofWordmark,
};
export default meta;

type Story = StoryObj<typeof HofWordmark>;

export const Default: Story = { args: { height: 64 } };
