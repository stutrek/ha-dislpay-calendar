// ============================================================================
// DailyChart Storybook Stories
// Showcase DailyChart component with various scenarios
// ============================================================================

import type { Meta, StoryObj } from '@storybook/preact';
import { DailyChart } from '../WeatherCard/DailyChart';
import {
  sunnyWeekHot,
  mixedWeek,
  rainyWeek,
  snowyWeek,
  variableWeek,
  threeDayForecast,
  twoWeekForecast,
  defaultSunTimes,
} from './dailyWeatherSamples';

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof DailyChart> = {
  title: 'Weather/DailyChart',
  component: DailyChart,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
  },
  argTypes: {
    height: {
      control: { type: 'range', min: 80, max: 200, step: 10 },
      defaultValue: 120,
    },
    minColumnWidth: {
      control: { type: 'range', min: 40, max: 100, step: 5 },
      defaultValue: 50,
    },
    precipitationUnit: {
      control: { type: 'select' },
      options: ['in', 'mm'],
      defaultValue: 'in',
    },
  },
};

export default meta;

type Story = StoryObj<typeof DailyChart>;

// ============================================================================
// Individual Stories
// ============================================================================

export const SunnyWeekHot: Story = {
  args: {
    forecast: sunnyWeekHot,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const MixedWeather: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const RainyWeek: Story = {
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const SnowyWeek: Story = {
  args: {
    forecast: snowyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const VariableWeek: Story = {
  args: {
    forecast: variableWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const ThreeDays: Story = {
  args: {
    forecast: threeDayForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const TwoWeeks: Story = {
  args: {
    forecast: twoWeekForecast,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const TallCanvas: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 180,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const ShortCanvas: Story = {
  args: {
    forecast: mixedWeek,
    sunTimes: defaultSunTimes,
    height: 80,
    minColumnWidth: 50,
    precipitationUnit: 'in',
  },
};

export const MetricUnits: Story = {
  args: {
    forecast: rainyWeek,
    sunTimes: defaultSunTimes,
    height: 120,
    minColumnWidth: 50,
    precipitationUnit: 'mm',
  },
};

// ============================================================================
// All Scenarios Grid
// ============================================================================

const AllScenariosGrid = () => {
  const scenarios = [
    { title: 'Sunny Week (Hot)', data: sunnyWeekHot },
    { title: 'Mixed Weather', data: mixedWeek },
    { title: 'Rainy Week', data: rainyWeek },
    { title: 'Snowy Week', data: snowyWeek },
    { title: 'Variable Week', data: variableWeek },
    { title: 'Three Days', data: threeDayForecast },
    { title: 'Two Weeks', data: twoWeekForecast },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        padding: '2rem',
        background: '#0f0f1e',
      }}
    >
      {scenarios.map((scenario, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <h4
            style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {scenario.title}
          </h4>
          <DailyChart
            forecast={scenario.data}
            sunTimes={defaultSunTimes}
            height={120}
            minColumnWidth={50}
            precipitationUnit="in"
          />
        </div>
      ))}
    </div>
  );
};

export const AllScenarios: Story = {
  render: AllScenariosGrid,
};
