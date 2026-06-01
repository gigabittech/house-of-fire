import type { Meta, StoryObj } from '@storybook/react';
import { PhotoPlaceholder } from './PhotoPlaceholder';

const meta: Meta<typeof PhotoPlaceholder> = {
  title: 'Media/PhotoPlaceholder',
  component: PhotoPlaceholder,
};
export default meta;

export const Palettes: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {[0, 1, 2, 3].map((seed) => (
        <PhotoPlaceholder
          key={seed}
          seed={seed}
          label={`SEED ${seed}`}
          style={{ height: 160, borderRadius: 10 }}
        />
      ))}
    </div>
  ),
};
