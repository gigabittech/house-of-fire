import type { Meta, StoryObj } from '@storybook/react';
import { HofScreen, HofScroll } from './HofScreen';

const meta: Meta<typeof HofScreen> = {
  title: 'Layout/HofScreen',
  component: HofScreen,
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 500, borderRadius: 16, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const Scrollable: StoryObj = {
  render: () => (
    <HofScreen>
      <HofScroll style={{ padding: 16 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static demo rows
            key={i}
            style={{ padding: 14, marginBottom: 8, background: '#141412', borderRadius: 12 }}
          >
            Row {i + 1}
          </div>
        ))}
      </HofScroll>
    </HofScreen>
  ),
};
