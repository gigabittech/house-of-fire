import type { Meta, StoryObj } from '@storybook/react';
import { FakeQR } from './FakeQR';

const meta: Meta<typeof FakeQR> = {
  title: 'UI/FakeQR',
  component: FakeQR,
};
export default meta;

type Story = StoryObj<typeof FakeQR>;

export const Default: Story = { args: { size: 220 } };
