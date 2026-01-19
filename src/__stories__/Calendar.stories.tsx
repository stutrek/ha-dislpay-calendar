import type { Meta, StoryObj } from '@storybook/preact';
import { CalendarProvider, type CalendarConfig, type CalendarEventWithSource, type WeatherForecast } from '../components/CalendarContext';
import { MonthGrid } from '../components/MonthGrid';
import { EventList } from '../components/EventList';
import { getAllStyles } from '../components/styleRegistry';
// Import component styles to register them
import '../components/DisplayCalendarCard.styles';

// Import sample data
import rawCalendarEvents from './calendar.json';
import hourlyForecast from './weatherForecastHourly.json';

// Add calendarId to events (simulate multiple calendars)
const calendarEvents: CalendarEventWithSource[] = rawCalendarEvents.map((event, index) => ({
  ...event,
  calendarId: index % 3 === 0 
    ? 'calendar.family' 
    : index % 3 === 1 
      ? 'calendar.work' 
      : 'calendar.school',
}));

// Config with multiple calendars
const config: CalendarConfig = {
  calendars: [
    { entityId: 'calendar.family', color: '#ff6b6b', name: 'Family' },
    { entityId: 'calendar.work', color: '#4ecdc4', name: 'Work' },
    { entityId: 'calendar.school', color: '#ffe66d', name: 'School' },
  ],
};

// Wrapper component for stories
function CalendarWidget({
  config,
  events,
  hourlyForecast,
  initialDate,
  fontSize,
}: {
  config: CalendarConfig;
  events: CalendarEventWithSource[];
  hourlyForecast?: WeatherForecast[];
  initialDate?: Date;
  fontSize?: string;
}) {
  // Merge fontSize into config
  const mergedConfig = { ...config, fontSize: fontSize || config.fontSize };
  
  return (
    <CalendarProvider
      config={mergedConfig}
      events={events}
      hourlyForecast={hourlyForecast}
      initialDate={initialDate}
    >
      <style>{getAllStyles()}</style>
      <div style={{ 
        width: '300px', 
        background: '#1c1c1c', 
        borderRadius: '12px',
        padding: '1rem',
        color: '#fff',
        fontSize: mergedConfig.fontSize,
      }}>
        <MonthGrid />
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          width: '100%',
        }}>
          <EventList />
        </div>
      </div>
    </CalendarProvider>
  );
}

const meta: Meta<typeof CalendarWidget> = {
  title: 'Calendar/CalendarWidget',
  component: CalendarWidget,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0d0d0d' }],
    },
  },
  argTypes: {
    initialDate: { control: 'date' },
    fontSize: { 
      control: 'text',
      description: 'Font size (e.g., 14px, 1rem)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarWidget>;

// Default story with current date
export const Default: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
  },
};

// Day with multiple events
export const BusyDay: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-19'),
  },
};

// Empty day
export const EmptyDay: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-25'),
  },
};

// Without weather data
export const NoWeather: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: undefined,
    initialDate: new Date('2026-01-18'),
  },
};

// Single calendar
export const SingleCalendar: Story = {
  args: {
    config: {
      calendars: [
        { entityId: 'calendar.family', color: '#ff6b6b', name: 'Family' },
      ],
    },
    events: calendarEvents.filter(e => e.calendarId === 'calendar.family'),
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
  },
};

// Small font size
export const SmallFont: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
    fontSize: '12px',
  },
};

// Large font size
export const LargeFont: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
    fontSize: '18px',
  },
};
