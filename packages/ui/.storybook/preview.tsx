import type { Preview } from '@storybook/react';
import '@hof/design-tokens/tokens.css';

// Render every story on the House of Fire dark surface.
const preview: Preview = {
  decorators: [
    (Story) => (
      <div
        style={{
          background: '#0A0A08',
          color: '#F0EDE6',
          minHeight: '100vh',
          padding: 24,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
