import type { Meta, StoryObj } from '@storybook/react';
import { HofPill, type PillTone } from './HofPill';

const meta: Meta<typeof HofPill> = {
  title: 'UI/HofPill',
  component: HofPill,
};
export default meta;

const tones: PillTone[] = ['neutral', 'amber', 'gold', 'danger', 'warning', 'success', 'crew'];

export const AllTones: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tones.map((tone) => (
        <HofPill key={tone} tone={tone}>
          {tone}
        </HofPill>
      ))}
    </div>
  ),
};

export const SellingFast: StoryObj<typeof HofPill> = {
  args: { tone: 'warning', children: 'Selling Fast · 47 left' },
};
