import { createContext } from 'preact';
import { useContext, useState, useMemo, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useCallbackStable } from '../shared/useCallbackStable';
import {
  useMultiCalendarEvents,
  useWeatherForecast,
  type CalendarEventWithSource,
  type WeatherForecast,
} from '../shared/HAContext';

// ============================================================================
// Default Color Palette
// ============================================================================

export const DEFAULT_COLORS = [
  '#ff6b6b', // coral red
  '#4ecdc4', // teal
  '#ffe66d', // yellow
  '#95e1d3', // mint
  '#f38181', // salmon
  '#aa96da', // lavender
  '#fcbad3', // pink
  '#a8d8ea', // sky blue
];

// ============================================================================
// Types
// ============================================================================

export interface CalendarConfigItem {
  entityId: `calendar.${string}`;
  color?: string;  // Optional - will be assigned from DEFAULT_COLORS if omitted
  name?: string;
}

/** Config item with color guaranteed (after normalization) */
export interface NormalizedCalendarConfigItem {
  entityId: `calendar.${string}`;
  color: string;
  name?: string;
}

export type FontSize = 'small' | 'medium' | 'large';

export interface CalendarConfig {
  calendars: CalendarConfigItem[];
  weatherEntity?: `weather.${string}`;
  fontSize?: FontSize;
}

/** Config with colors guaranteed (after normalization) */
export interface NormalizedCalendarConfig {
  calendars: NormalizedCalendarConfigItem[];
  weatherEntity?: `weather.${string}`;
  fontSize?: FontSize;
}

/**
 * Normalize config by filling in missing colors from the default palette
 */
export function normalizeConfig(config: CalendarConfig): NormalizedCalendarConfig {
  return {
    ...config,
    calendars: config.calendars.map((cal, index) => ({
      ...cal,
      color: cal.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    })),
  };
}

export interface EventWeather {
  temperature: number;
  condition: string;
}

export interface EnrichedEvent {
  start: string;
  end: string;
  summary: string;
  description?: string;
  location?: string;
  uid?: string;
  colors: string[];
  calendarIds: string[];
  weather?: EventWeather;
  isAllDay: boolean;
}

export interface CalendarContextValue {
  config: NormalizedCalendarConfig;
  currentMonth: Date;
  selectedDay: Date;
  today: Date;
  loading: boolean;
  refreshing: boolean;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;
  selectDay: (date: Date) => void;
  eventsForSelectedDay: EnrichedEvent[];
  getColorsForDay: (date: Date) => string[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if an event is all-day (no time component in start)
 */
export function isAllDay(event: { start: string }): boolean {
  // All-day events have date-only strings like "2026-01-19"
  // Timed events have ISO strings like "2026-01-18T10:00:00-05:00"
  return !event.start.includes('T');
}

/**
 * Parse event start/end to Date objects
 */
function parseEventDate(dateStr: string): Date {
  if (!dateStr.includes('T')) {
    // Date-only string, parse as local date
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

/**
 * Generate a deduplication key for an event
 */
function getDedupeKey(event: CalendarEventWithSource): string {
  const uid = event.uid ?? '';
  const startTime = event.start;
  const endTime = event.end;
  const summary = event.summary ?? '';
  return `${uid}|||${startTime}|||${endTime}|||${summary}`;
}

/**
 * Find the closest hourly forecast for a given datetime
 */
function findClosestForecast(
  datetime: Date,
  forecasts: WeatherForecast[]
): WeatherForecast | undefined {
  if (forecasts.length === 0) return undefined;
  
  let closest = forecasts[0];
  let closestDiff = Math.abs(datetime.getTime() - new Date(closest.datetime).getTime());
  
  for (const forecast of forecasts) {
    const diff = Math.abs(datetime.getTime() - new Date(forecast.datetime).getTime());
    if (diff < closestDiff) {
      closest = forecast;
      closestDiff = diff;
    }
  }
  
  // Only return forecast if it's within 2 hours of the requested time
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  if (closestDiff > TWO_HOURS_MS) {
    return undefined;
  }
  
  return closest;
}

/**
 * Deduplicate and enrich events
 */
function processEvents(
  events: CalendarEventWithSource[],
  config: NormalizedCalendarConfig,
  hourlyForecast: WeatherForecast[]
): EnrichedEvent[] {
  // Build color map from config (colors are guaranteed after normalization)
  const colorMap = new Map<string, string>();
  for (const cal of config.calendars) {
    colorMap.set(cal.entityId, cal.color);
  }
  
  // Group events by dedup key
  const grouped = new Map<string, CalendarEventWithSource[]>();
  for (const event of events) {
    const key = getDedupeKey(event);
    const existing = grouped.get(key) ?? [];
    existing.push(event);
    grouped.set(key, existing);
  }
  
  // Merge duplicates into enriched events
  const enriched: EnrichedEvent[] = [];
  
  for (const [, group] of grouped) {
    // Use first event as base
    const base = group[0];
    const allDay = isAllDay(base);
    
    // Collect all calendar IDs and colors
    const calendarIds = [...new Set(group.map(e => e.calendarId))];
    const colors = calendarIds
      .map(id => colorMap.get(id))
      .filter((c): c is string => c !== undefined);
    
    // Find weather for timed events
    let weather: EventWeather | undefined;
    if (!allDay && hourlyForecast.length > 0) {
      const startDate = parseEventDate(base.start);
      const forecast = findClosestForecast(startDate, hourlyForecast);
      if (forecast?.temperature !== undefined && forecast?.condition) {
        weather = {
          temperature: forecast.temperature,
          condition: forecast.condition,
        };
      }
    }
    
    enriched.push({
      start: base.start,
      end: base.end,
      summary: base.summary,
      description: base.description,
      location: base.location,
      uid: base.uid,
      colors: colors.length > 0 ? colors : ['#888'],
      calendarIds,
      weather,
      isAllDay: allDay,
    });
  }
  
  return enriched;
}

/**
 * Sort events: timed first (by start time), then all-day
 */
function sortEvents(events: EnrichedEvent[]): EnrichedEvent[] {
  return [...events].sort((a, b) => {
    // All-day events go last
    if (a.isAllDay !== b.isAllDay) {
      return a.isAllDay ? 1 : -1;
    }
    // Sort by start time
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Format time for display: "10-11", "3:30-5"
 */
export function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Convert to 12-hour format without AM/PM
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    if (minutes === 0) {
      return String(hours);
    }
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };
  
  return `${formatTime(startDate)}-${formatTime(endDate)}`;
}

// ============================================================================
// Context
// ============================================================================

const CalendarContext = createContext<CalendarContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface CalendarProviderProps {
  config: CalendarConfig;
  // Option 1: Pass data directly (for Storybook/testing)
  events?: CalendarEventWithSource[];
  hourlyForecast?: WeatherForecast[];
  initialDate?: Date;
  children: ComponentChildren;
}

/**
 * Calendar Provider that manages calendar UI state and event processing.
 * 
 * For Storybook/testing: Pass events and hourlyForecast props directly.
 * For Home Assistant: Render inside HAProvider - will use HAContext hooks to fetch data.
 */
export function CalendarProvider({
  config: rawConfig,
  events: propEvents,
  hourlyForecast: propForecast,
  initialDate,
  children,
}: CalendarProviderProps) {
  // Normalize config to fill in missing colors
  const config = useMemo(() => normalizeConfig(rawConfig), [rawConfig]);
  
  const [today, setToday] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  
  // Update today at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      setToday(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [today]); // Re-run after today updates to schedule next midnight
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = initialDate ?? today;
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  
  const [selectedDay, setSelectedDay] = useState(() => initialDate ?? today);
  
  // Date range for fetching (covers the visible calendar month grid)
  const dateRange = useMemo(() => {
    // First day of the month
    const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    // Last day of the month
    const lastOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Extend to cover the full calendar grid (which shows partial weeks)
    // Start from the Sunday of the week containing the 1st
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - start.getDay());
    
    // End on the Saturday of the week containing the last day
    const end = new Date(lastOfMonth);
    end.setDate(end.getDate() + (6 - end.getDay()));
    // Set to end of day
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, [currentMonth]);
  
  // Get entity IDs from config
  const calendarEntityIds = useMemo(
    () => config.calendars.map(c => c.entityId),
    [config.calendars]
  );
  
  // Use HAContext hooks to fetch data (only runs if inside HAProvider)
  // These hooks gracefully handle missing HAProvider by returning errors
  let hookEvents: CalendarEventWithSource[] | undefined;
  let hookForecast: WeatherForecast[] | undefined;
  let hookLoading = false;
  let hookRefreshing = false;
  
  try {
    const eventsResult = useMultiCalendarEvents(calendarEntityIds, dateRange);
    hookEvents = eventsResult.events;
    hookLoading = eventsResult.loading;
    hookRefreshing = eventsResult.refreshing;
    
    if (config.weatherEntity) {
      const forecastResult = useWeatherForecast(config.weatherEntity, 'hourly');
      hookForecast = forecastResult.forecast;
      hookLoading = hookLoading || forecastResult.loading;
    }
  } catch {
    // Not inside HAProvider - hooks will throw
    // This is expected when using prop data in Storybook
  }
  
  // Use prop data if provided, otherwise use hook data
  const events = propEvents ?? hookEvents ?? [];
  const hourlyForecast = propForecast ?? hookForecast ?? [];
  const loading = propEvents ? false : hookLoading;
  const refreshing = propEvents ? false : hookRefreshing;
  
  // Process all events (dedupe, enrich with colors and weather)
  const allEvents = useMemo(
    () => processEvents(events, config, hourlyForecast),
    [events, config, hourlyForecast]
  );
  
  // Events for selected day
  const eventsForSelectedDay = useMemo(() => {
    const dayEvents = allEvents.filter(event => {
      const start = parseEventDate(event.start);
      const end = parseEventDate(event.end);
      const dayStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
      const dayEnd = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() + 1);
      return start < dayEnd && end > dayStart;
    });
    return sortEvents(dayEvents);
  }, [allEvents, selectedDay]);
  
  // Pre-compute colors for each day to avoid O(days × events) in render
  const colorsByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const event of allEvents) {
      const start = parseEventDate(event.start);
      const end = parseEventDate(event.end);
      // Iterate through each day the event spans
      const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      // For all-day events, end date is exclusive (next day), so subtract 1
      if (event.isAllDay) {
        endDay.setDate(endDay.getDate() - 1);
      }
      while (current <= endDay) {
        const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
        if (!map.has(key)) map.set(key, new Set());
        for (const color of event.colors) {
          map.get(key)!.add(color);
        }
        current.setDate(current.getDate() + 1);
      }
    }
    // Convert Sets to arrays
    const result = new Map<string, string[]>();
    for (const [key, colors] of map) {
      result.set(key, [...colors]);
    }
    return result;
  }, [allEvents]);

  // Get unique colors for events on a given day (for dots on calendar)
  const getColorsForDay = useCallbackStable((day: Date): string[] => {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    return colorsByDay.get(key) ?? [];
  });
  
  const nextMonth = useCallbackStable(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      // If navigating to today's month, select today; otherwise select the 1st
      if (newMonth.getMonth() === today.getMonth() && newMonth.getFullYear() === today.getFullYear()) {
        setSelectedDay(today);
      } else {
        setSelectedDay(newMonth);
      }
      return newMonth;
    });
  });
  
  const prevMonth = useCallbackStable(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      // If navigating to today's month, select today; otherwise select the 1st
      if (newMonth.getMonth() === today.getMonth() && newMonth.getFullYear() === today.getFullYear()) {
        setSelectedDay(today);
      } else {
        setSelectedDay(newMonth);
      }
      return newMonth;
    });
  });
  
  const selectDay = useCallbackStable((date: Date) => {
    setSelectedDay(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  });
  
  const goToToday = useCallbackStable(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(todayDate);
  });
  
  // Auto-return to today after 2 minutes of being away from today
  useEffect(() => {
    const isViewingToday = 
      selectedDay.getFullYear() === today.getFullYear() &&
      selectedDay.getMonth() === today.getMonth() &&
      selectedDay.getDate() === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
    
    if (isViewingToday) {
      return; // No timer needed when viewing today
    }
    
    const timer = setTimeout(() => {
      goToToday();
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearTimeout(timer);
  }, [selectedDay, currentMonth, today, goToToday]);
  
  const value = useMemo<CalendarContextValue>(() => ({
    config,
    currentMonth,
    selectedDay,
    today,
    loading,
    refreshing,
    nextMonth,
    prevMonth,
    goToToday,
    selectDay,
    eventsForSelectedDay,
    getColorsForDay,
  }), [config, currentMonth, selectedDay, today, loading, refreshing, nextMonth, prevMonth, goToToday, selectDay, eventsForSelectedDay, getColorsForDay]);
  
  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

// Re-export types from HAContext for convenience
export type { CalendarEventWithSource, WeatherForecast } from '../shared/HAContext';
