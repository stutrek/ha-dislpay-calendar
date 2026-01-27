import type { Meta, StoryObj } from '@storybook/preact';
import { HourlyChart } from '../WeatherCard/HourlyChart';
import type { SunTimes } from '../WeatherCard/WeatherContext';
import { createAdaptiveTemperatureColorFn } from '../WeatherCard/HourlyChart/colors';
import * as samples from './hourlyWeatherSamples';

// Helper to create color function from sample data
function createColorFnForSample(data: typeof samples.sunnySkyHot) {
  const temps = data.map(d => d.temperature ?? 70);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  return createAdaptiveTemperatureColorFn(min, max, 10);
}

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof HourlyChart> = {
  title: 'Weather/HourlyCard2',
  component: HourlyChart,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0d0d0d' }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof HourlyChart>;

// ============================================================================
// Sun Times for Different Scenarios
// ============================================================================

// Standard daytime scenarios (8am start, sunrise at 6am, sunset at 6pm)
const daytimeSunTimes: SunTimes = {
  sunrise: new Date('2026-01-24T06:00:00'),
  sunset: new Date('2026-01-24T18:00:00'),
  dawn: new Date('2026-01-24T05:30:00'),
  dusk: new Date('2026-01-24T18:30:00'),
};

// Sunset scenarios (start at 2pm, sunset at 6pm)
const sunsetSunTimes: SunTimes = {
  sunrise: new Date('2026-01-24T06:00:00'),
  sunset: new Date('2026-01-24T18:00:00'),
  dawn: new Date('2026-01-24T05:30:00'),
  dusk: new Date('2026-01-24T18:30:00'),
};

// Sunrise scenarios (start at 2am, sunrise at 6am)
const sunriseSunTimes: SunTimes = {
  sunrise: new Date('2026-01-24T06:00:00'),
  sunset: new Date('2026-01-24T18:00:00'),
  dawn: new Date('2026-01-24T05:30:00'),
  dusk: new Date('2026-01-24T18:30:00'),
};

// ============================================================================
// All Scenarios Grid
// ============================================================================

const AllScenariosGrid = () => {
  const scenarios = [
    { title: '☀️ Sunny - Hot', data: samples.sunnySkyHot, sunTimes: daytimeSunTimes },
    { title: '☀️ Sunny - Mild', data: samples.sunnySkyMild, sunTimes: daytimeSunTimes },
    { title: '☀️ Sunny - Cold', data: samples.sunnySkyCold, sunTimes: daytimeSunTimes },
    { title: '☁️ Cloudy - Hot', data: samples.cloudySkyHot, sunTimes: daytimeSunTimes },
    { title: '☁️ Cloudy - Mild', data: samples.cloudySkyMild, sunTimes: daytimeSunTimes },
    { title: '☁️ Cloudy - Cold', data: samples.cloudySkyCold, sunTimes: daytimeSunTimes },
    { title: '🌧️ Rainy - Hot', data: samples.rainyDayHot, sunTimes: daytimeSunTimes },
    { title: '🌧️ Rainy - Mild', data: samples.rainyDayMild, sunTimes: daytimeSunTimes },
    { title: '🌧️ Rainy - Cold', data: samples.rainyDayCold, sunTimes: daytimeSunTimes },
    { title: '❄️ Snowy - Hot', data: samples.snowyDayHot, sunTimes: daytimeSunTimes },
    { title: '❄️ Snowy - Mild', data: samples.snowyDayMild, sunTimes: daytimeSunTimes },
    { title: '❄️ Snowy - Cold', data: samples.snowyDayCold, sunTimes: daytimeSunTimes },
    { title: '🌤️🌧️ Mixed Rain - Hot', data: samples.mixedRainHot, sunTimes: daytimeSunTimes },
    { title: '🌤️🌧️ Mixed Rain - Mild', data: samples.mixedRainMild, sunTimes: daytimeSunTimes },
    { title: '🌤️🌧️ Mixed Rain - Cold', data: samples.mixedRainCold, sunTimes: daytimeSunTimes },
    { title: '🌤️❄️ Mixed Snow - Hot', data: samples.mixedSnowHot, sunTimes: daytimeSunTimes },
    { title: '🌤️❄️ Mixed Snow - Mild', data: samples.mixedSnowMild, sunTimes: daytimeSunTimes },
    { title: '🌤️❄️ Mixed Snow - Cold', data: samples.mixedSnowCold, sunTimes: daytimeSunTimes },
    { title: '🌅 Sunset - Hot', data: samples.sunsetHot, sunTimes: sunsetSunTimes },
    { title: '🌅 Sunset - Mild', data: samples.sunsetMild, sunTimes: sunsetSunTimes },
    { title: '🌅 Sunset - Cold', data: samples.sunsetCold, sunTimes: sunsetSunTimes },
    { title: '🌄 Sunrise - Hot', data: samples.sunriseHot, sunTimes: sunriseSunTimes },
    { title: '🌄 Sunrise - Mild', data: samples.sunriseMild, sunTimes: sunriseSunTimes },
    { title: '🌄 Sunrise - Cold', data: samples.sunriseCold, sunTimes: sunriseSunTimes },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1.5rem',
      padding: '2rem',
      maxWidth: '1800px',
    }}>
      {scenarios.map((scenario, index) => (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ 
            margin: 0, 
            color: '#fff', 
            fontSize: '0.9rem',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {scenario.title}
          </h4>
          <HourlyChart 
            forecast={scenario.data} 
            sunTimes={scenario.sunTimes} 
            getTemperatureColor={createColorFnForSample(scenario.data)}
          />
        </div>
      ))}
    </div>
  );
};

export const AllScenarios: Story = {
  name: '🌈 All 24 Scenarios',
  render: () => AllScenariosGrid(),
  parameters: {
    layout: 'fullscreen',
  },
};

// ============================================================================
// Individual Stories (for detailed viewing)
// ============================================================================

export const SunnyHot: Story = {
  name: '☀️ Sunny - Hot (85-100°F)',
  args: {
    forecast: samples.sunnySkyHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunnySkyHot),
  },
};

export const SunnyMild: Story = {
  name: '☀️ Sunny - Mild (55-75°F)',
  args: {
    forecast: samples.sunnySkyMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunnySkyMild),
  },
};

export const SunnyCold: Story = {
  name: '☀️ Sunny - Cold (15-35°F)',
  args: {
    forecast: samples.sunnySkyCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunnySkyCold),
  },
};

// ============================================================================
// Stories - Cloudy Day
// ============================================================================

export const CloudyHot: Story = {
  name: '☁️ Cloudy - Hot (85-95°F)',
  args: {
    forecast: samples.cloudySkyHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.cloudySkyHot),
  },
};

export const CloudyMild: Story = {
  name: '☁️ Cloudy - Mild (55-68°F)',
  args: {
    forecast: samples.cloudySkyMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.cloudySkyMild),
  },
};

export const CloudyCold: Story = {
  name: '☁️ Cloudy - Cold (15-30°F)',
  args: {
    forecast: samples.cloudySkyCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.cloudySkyCold),
  },
};

// ============================================================================
// Stories - Rainy Day
// ============================================================================

export const RainyHot: Story = {
  name: '🌧️ Rainy - Hot (85-92°F)',
  args: {
    forecast: samples.rainyDayHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.rainyDayHot),
  },
};

export const RainyMild: Story = {
  name: '🌧️ Rainy - Mild (55-65°F)',
  args: {
    forecast: samples.rainyDayMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.rainyDayMild),
  },
};

export const RainyCold: Story = {
  name: '🌧️ Rainy - Cold (35-42°F)',
  args: {
    forecast: samples.rainyDayCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.rainyDayCold),
  },
};

// ============================================================================
// Stories - Snowy Day
// ============================================================================

export const SnowyHot: Story = {
  name: '❄️ Snowy - Hot (85-95°F)',
  args: {
    forecast: samples.snowyDayHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.snowyDayHot),
  },
};

export const SnowyMild: Story = {
  name: '❄️ Snowy - Mild (55-65°F)',
  args: {
    forecast: samples.snowyDayMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.snowyDayMild),
  },
};

export const SnowyCold: Story = {
  name: '❄️ Snowy - Cold (15-28°F)',
  args: {
    forecast: samples.snowyDayCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.snowyDayCold),
  },
};

// ============================================================================
// Stories - Mixed (Sun, Clouds, Rain)
// ============================================================================

export const MixedRainHot: Story = {
  name: '🌤️🌧️ Mixed Rain - Hot (85-98°F)',
  args: {
    forecast: samples.mixedRainHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedRainHot),
  },
};

export const MixedRainMild: Story = {
  name: '🌤️🌧️ Mixed Rain - Mild (55-72°F)',
  args: {
    forecast: samples.mixedRainMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedRainMild),
  },
};

export const MixedRainCold: Story = {
  name: '🌤️🌧️ Mixed Rain - Cold (15-38°F)',
  args: {
    forecast: samples.mixedRainCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedRainCold),
  },
};

// ============================================================================
// Stories - Mixed (Sun, Clouds, Snow)
// ============================================================================

export const MixedSnowHot: Story = {
  name: '🌤️❄️ Mixed Snow - Hot (85-95°F)',
  args: {
    forecast: samples.mixedSnowHot,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedSnowHot),
  },
};

export const MixedSnowMild: Story = {
  name: '🌤️❄️ Mixed Snow - Mild (55-68°F)',
  args: {
    forecast: samples.mixedSnowMild,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedSnowMild),
  },
};

export const MixedSnowCold: Story = {
  name: '🌤️❄️ Mixed Snow - Cold (15-32°F)',
  args: {
    forecast: samples.mixedSnowCold,
    sunTimes: daytimeSunTimes,
    getTemperatureColor: createColorFnForSample(samples.mixedSnowCold),
  },
};

// ============================================================================
// Stories - Sunset
// ============================================================================

export const SunsetHot: Story = {
  name: '🌅 Sunset - Hot (80-95°F)',
  args: {
    forecast: samples.sunsetHot,
    sunTimes: sunsetSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunsetHot),
  },
};

export const SunsetMild: Story = {
  name: '🌅 Sunset - Mild (58-70°F)',
  args: {
    forecast: samples.sunsetMild,
    sunTimes: sunsetSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunsetMild),
  },
};

export const SunsetCold: Story = {
  name: '🌅 Sunset - Cold (20-32°F)',
  args: {
    forecast: samples.sunsetCold,
    sunTimes: sunsetSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunsetCold),
  },
};

// ============================================================================
// Stories - Sunrise
// ============================================================================

export const SunriseHot: Story = {
  name: '🌄 Sunrise - Hot (75-93°F)',
  args: {
    forecast: samples.sunriseHot,
    sunTimes: sunriseSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunriseHot),
  },
};

export const SunriseMild: Story = {
  name: '🌄 Sunrise - Mild (50-68°F)',
  args: {
    forecast: samples.sunriseMild,
    sunTimes: sunriseSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunriseMild),
  },
};

export const SunriseCold: Story = {
  name: '🌄 Sunrise - Cold (10-28°F)',
  args: {
    forecast: samples.sunriseCold,
    sunTimes: sunriseSunTimes,
    getTemperatureColor: createColorFnForSample(samples.sunriseCold),
  },
};
