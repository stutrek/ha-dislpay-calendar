import { useCalendar, formatTimeRange, type EnrichedEvent } from './CalendarContext';

// CSS is imported via shadow DOM styles or storybook
// import './EventList.css';

// Weather condition to MDI icon mapping
const WEATHER_ICONS: Record<string, string> = {
  sunny: 'mdi:weather-sunny',
  'clear-night': 'mdi:weather-night',
  cloudy: 'mdi:weather-cloudy',
  partlycloudy: 'mdi:weather-partly-cloudy',
  'partlycloudy-night': 'mdi:weather-night-partly-cloudy',
  rainy: 'mdi:weather-rainy',
  pouring: 'mdi:weather-pouring',
  snowy: 'mdi:weather-snowy',
  'snowy-rainy': 'mdi:weather-snowy-rainy',
  fog: 'mdi:weather-fog',
  hail: 'mdi:weather-hail',
  lightning: 'mdi:weather-lightning',
  'lightning-rainy': 'mdi:weather-lightning-rainy',
  windy: 'mdi:weather-windy',
  'windy-variant': 'mdi:weather-windy-variant',
  exceptional: 'mdi:alert-circle-outline',
};

function WeatherDisplay({ condition, temperature }: { condition: string; temperature: number }) {
  const icon = WEATHER_ICONS[condition] ?? 'mdi:thermometer';
  
  return (
    <span class="event-weather">
      <ha-icon icon={icon} class="weather-icon" />
      <span class="weather-temp">{Math.round(temperature)}°</span>
    </span>
  );
}

function EventItem({ event }: { event: EnrichedEvent }) {
  const timeRange = event.isAllDay ? null : formatTimeRange(event.start, event.end);
  
  return (
    <div class="event-item">
      <div class="event-colors">
        {event.colors.map((color, i) => (
          <span
            key={i}
            class="event-color-bar"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div class="event-content">
        {timeRange && <span class="event-time">{timeRange}</span>}
        <span class="event-summary">{event.summary}</span>
      </div>
      {event.weather && (
        <WeatherDisplay
          condition={event.weather.condition}
          temperature={event.weather.temperature}
        />
      )}
    </div>
  );
}

export function EventList() {
  const { eventsForSelectedDay, selectedDay } = useCalendar();
  
  // Separate timed and all-day events (already sorted by context)
  const timedEvents = eventsForSelectedDay.filter(e => !e.isAllDay);
  const allDayEvents = eventsForSelectedDay.filter(e => e.isAllDay);
  
  const hasTimedEvents = timedEvents.length > 0;
  const hasAllDayEvents = allDayEvents.length > 0;
  
  if (eventsForSelectedDay.length === 0) {
    return (
      <div class="event-list">
        <div class="event-list-empty">
          No events on {selectedDay.toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div class="event-list">
      {/* Timed events */}
      {timedEvents.map((event, i) => (
        <EventItem key={`timed-${i}`} event={event} />
      ))}
      
      {/* Divider between timed and all-day */}
      {hasTimedEvents && hasAllDayEvents && (
        <div class="event-divider" />
      )}
      
      {/* All-day events */}
      {allDayEvents.map((event, i) => (
        <EventItem key={`allday-${i}`} event={event} />
      ))}
    </div>
  );
}
