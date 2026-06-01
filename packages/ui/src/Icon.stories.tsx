import type { Meta, StoryObj } from '@storybook/react';
import { Icon, type IconName } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'UI/Icon',
  component: Icon,
};
export default meta;

type Story = StoryObj<typeof Icon>;

export const Single: Story = { args: { name: 'flame', size: 28 } };

const names: IconName[] = [
  'home',
  'calendar',
  'users',
  'user',
  'clock',
  'pin',
  'star',
  'ticket',
  'arrowR',
  'arrowL',
  'chev',
  'plus',
  'close',
  'check',
  'share',
  'download',
  'wallet',
  'camera',
  'image',
  'flame',
  'search',
  'settings',
  'bell',
  'bolt',
  'music',
  'drop',
  'grid',
  'chat',
  'qr',
  'fire',
  'diamond',
];

export const Gallery: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 16 }}>
      {names.map((n) => (
        <div
          key={n}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <Icon name={n} size={24} color="#F0EDE6" />
          <span style={{ fontSize: 9, color: '#8A8880', fontFamily: 'monospace' }}>{n}</span>
        </div>
      ))}
    </div>
  ),
};
