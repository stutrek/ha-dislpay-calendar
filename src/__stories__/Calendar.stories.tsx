import type { Meta, StoryObj } from '@storybook/preact';
import { CalendarProvider, type CalendarConfig, type CalendarEventWithSource, type WeatherForecast, type FontSize } from '../CalendarCard/CalendarContext';
import { CalendarCardInner } from '../CalendarCard';
import { getAllStyles } from '../shared/styleRegistry';
// Import component styles to register them
import '../CalendarCard/DisplayCalendarCard.styles';

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
  fontSize = 'small',
}: {
  config: CalendarConfig;
  events: CalendarEventWithSource[];
  hourlyForecast?: WeatherForecast[];
  initialDate?: Date;
  fontSize?: FontSize;
}) {
  const mergedConfig = { ...config, fontSize };
  
  return (
    <CalendarProvider
      config={mergedConfig}
      events={events}
      hourlyForecast={hourlyForecast}
      initialDate={initialDate}
    >
      <style>{getAllStyles()}</style>
      <div 
        class={`calendar-card size-${fontSize}`}
        style={{ 
          width: '400px', 
          background: '#1c1c1c', 
          borderRadius: '12px',
          padding: '1em',
          color: '#fff',
        }}
      >

        <CalendarCardInner />
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
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Calendar size',
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
    fontSize: 'small',
  },
};

// Day with multiple events
export const BusyDay: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-19'),
    fontSize: 'small',
  },
};

// Empty day
export const EmptyDay: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-25'),
    fontSize: 'small',
  },
};

// Without weather data
export const NoWeather: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: undefined,
    initialDate: new Date('2026-01-18'),
    fontSize: 'small',
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
    fontSize: 'small',
  },
};

// Medium font size
export const MediumSize: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
    fontSize: 'medium',
  },
};

// Large font size
export const LargeSize: Story = {
  args: {
    config,
    events: calendarEvents,
    hourlyForecast: hourlyForecast as WeatherForecast[],
    initialDate: new Date('2026-01-18'),
    fontSize: 'large',
  },
};
