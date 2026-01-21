/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Card build configurations
const cardConfigs = {
  calendar: {
    entry: path.resolve(dirname, 'src/CalendarCard/index.tsx'),
    name: 'DisplayCalendar',
    fileName: 'display-calendar.js',
  },
  weather: {
    entry: path.resolve(dirname, 'src/WeatherCard/index.tsx'),
    name: 'DisplayWeather',
    fileName: 'display-weather.js',
  },
};

// Determine which card to build from CARD env var (defaults to 'calendar')
const cardToBuild = (process.env.CARD as keyof typeof cardConfigs) || 'calendar';
const cardConfig = cardConfigs[cardToBuild];

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [preact()],
  build: {
    // Build as a single JS file for HA custom card
    lib: {
      entry: cardConfig.entry,
      name: cardConfig.name,
      formats: ['es'],
      fileName: () => cardConfig.fileName,
    },
    rollupOptions: {
      // Bundle everything including preact
      external: [],
    },
    // Output to dist folder
    outDir: 'dist',
    // Don't minify for easier debugging
    minify: false,
    // Don't empty outDir so both card builds can coexist
    emptyOutDir: false,
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});
