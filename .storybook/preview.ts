import type { Preview } from '@storybook/preact-vite'

// Register mock ha-icon component for Storybook (uses @mdi/js for real icons)
import '../src/__stories__/ha-icon-mock';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;