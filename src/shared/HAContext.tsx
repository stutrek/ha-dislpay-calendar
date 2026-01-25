import { createContext } from 'preact';
import { useContext, useRef, useEffect, useState, useMemo } from 'preact/hooks';
import type {
  HassEntities,
  HassConfig,
  HassServices,
  HassEntity,
  HassEntityBase,
  HassEntityAttributeBase,
  Connection,
} from 'home-assistant-js-websocket';
import { useCallbackStable } from './useCallbackStable';
import type { ComponentChildren } from 'preact';

// ============================================================================
// Domain-Specific Entity Types
// ============================================================================

/**
 * Calendar entity - only exposes the current/next event.
 * Use useCalendarEvents() to fetch a list of events.
 */
export interface CalendarEntity extends HassEntityBase {
  entity_id: `calendar.${string}`;
  state: 'on' | 'off' | 'unavailable' | 'unknown';
  attributes: HassEntityAttributeBase & {
    message?: string;        // Event title/summary
    description?: string;    // Event description
    start_time?: string;     // ISO datetime
    end_time?: string;       // ISO datetime
    location?: string;
    all_day?: boolean;
  };
}

/**
 * Weather entity - current conditions only.
 * Use useWeatherForecast() to fetch forecast data.
 */
export interface WeatherEntity extends HassEntityBase {
  entity_id: `weather.${string}`;
  state: string;  // 'sunny', 'cloudy', 'rainy', 'partlycloudy', etc.
  attributes: HassEntityAttributeBase & {
    temperature?: number;
    apparent_temperature?: number;
    dew_point?: number;
    humidity?: number;
    pressure?: number;
    wind_speed?: number;
    wind_gust_speed?: number;
    wind_bearing?: number;
    visibility?: number;
    supported_features?: number;  // Bitmask for supported forecast types
  };
}

/**
 * Sun entity - provides sunrise/sunset times.
 */
export interface SunEntity extends HassEntityBase {
  entity_id: 'sun.sun';
  state: 'above_horizon' | 'below_horizon';
  attributes: HassEntityAttributeBase & {
    next_dawn?: string;      // ISO datetime
    next_dusk?: string;      // ISO datetime
    next_midnight?: string;  // ISO datetime
    next_noon?: string;      // ISO datetime
    next_rising?: string;    // ISO datetime (sunrise)
    next_setting?: string;   // ISO datetime (sunset)
    elevation?: number;      // Sun elevation in degrees
    azimuth?: number;        // Sun azimuth in degrees
    rising?: boolean;        // True if sun is rising
  };
}

/**
 * Calendar event returned by calendar/get_events websocket command
 */
export interface CalendarEvent {
  start: string;           // ISO datetime or date string
  end: string;             // ISO datetime or date string
  summary: string;         // Event title
  description?: string;
  location?: string;
  uid?: string;
  recurrence_id?: string;
  rrule?: string;
}

/**
 * Calendar event with its source calendar ID attached
 */
export interface CalendarEventWithSource extends CalendarEvent {
  calendarId: string;
}

/**
 * Weather forecast item returned by weather/get_forecasts websocket command
 */
export interface WeatherForecast {
  datetime: string;                    // ISO timestamp
  condition?: string;                  // Weather condition
  temperature?: number;                // High temp (or current for hourly)
  templow?: number;                    // Low temp (daily forecasts)
  precipitation_probability?: number;  // 0-100
  precipitation?: number;              // Amount in mm/inches
  humidity?: number;
  wind_speed?: number;
  wind_bearing?: number;
  cloud_coverage?: number;             // 0-100 cloud coverage percentage
  uv_index?: number;                   // UV index
  is_daytime?: boolean;                // For twice_daily forecasts
}

export type ForecastType = 'daily' | 'hourly' | 'twice_daily';

// ============================================================================
// Domain Entity Mapping
// ============================================================================

interface DomainEntityMap {
  calendar: CalendarEntity;
  weather: WeatherEntity;
  sun: SunEntity;
}

type KnownDomain = keyof DomainEntityMap;

/**
 * Infers the entity type from an entity ID string.
 * e.g., 'calendar.family' -> CalendarEntity
 *       'weather.home' -> WeatherEntity
 *       'sensor.temp' -> HassEntity (fallback)
 */
export type EntityForId<T extends string> =
  T extends `${infer D}.${string}`
    ? D extends KnownDomain
      ? DomainEntityMap[D]
      : HassEntity
    : HassEntity;

// ============================================================================
// HomeAssistant & Store Types
// ============================================================================

export interface HomeAssistant {
  states: HassEntities;
  config: HassConfig;
  services: HassServices;
  connection: Connection;
  callService: (domain: string, service: string, data?: object) => Promise<void>;
  themes?: {
    darkMode?: boolean;
    theme?: string;
  };
}

interface HAStore {
  hass: HomeAssistant | undefined;
  getHass: () => HomeAssistant | undefined;
  subscribeToEntity: (entityId: string, callback: (entity: any) => void) => () => void;
}

// ============================================================================
// Context
// ============================================================================

const HAContext = createContext<HAStore | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface HAProviderProps {
  hass: HomeAssistant | undefined;
  subscribeToEntity: (entityId: string, callback: (entity: any) => void) => () => void;
  children: ComponentChildren;
}

export function HAProvider({ hass, subscribeToEntity, children }: HAProviderProps) {
  console.log('[HAProvider] RENDER', { hasHass: !!hass, statesCount: Object.keys(hass?.states || {}).length });
  
  // Store hass in ref for stable access
  const hassRef = useRef(hass);
  hassRef.current = hass;
  
  const getHass = useCallbackStable(() => hassRef.current);
  
  // Create stable store with subscription function from web component
  const store = useMemo<HAStore>(() => {
    console.log('[HAProvider] useMemo - creating store');
    return {
      hass: hassRef.current,
      getHass,
      subscribeToEntity, // Pass through from web component
    };
  }, [getHass, subscribeToEntity]);

  return (
    <HAContext.Provider value={store}>
      {children}
    </HAContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

function useHAStore(): HAStore {
  const store = useContext(HAContext);
  if (!store) {
    throw new Error('useEntity/useHass must be used within an HAProvider');
  }
  return store;
}

/**
 * Subscribe to a specific entity by ID.
 * Only re-renders when that specific entity's state changes.
 * 
 * Returns a typed entity based on the domain prefix:
 * - 'calendar.xyz' -> CalendarEntity
 * - 'weather.xyz' -> WeatherEntity
 * - other domains -> HassEntity
 * 
 * @param entityId The entity ID to subscribe to (e.g., 'calendar.family')
 * @returns The typed entity state, or undefined if not found
 */
export function useEntity<T extends string>(entityId: T): EntityForId<T> | undefined {
  const store = useHAStore();
  
  // Initial state from current hass
  const [entity, setEntity] = useState<EntityForId<T> | undefined>(() => 
    store.hass?.states[entityId] as EntityForId<T> | undefined
  );

  useEffect(() => {
    console.log(`[useEntity] Subscribing to ${entityId}`);
    
    // Subscribe to entity changes via web component
    const unsubscribe = store.subscribeToEntity(entityId, (newEntity) => {
      console.log(`[useEntity] ${entityId} changed, updating state`);
      setEntity(newEntity as EntityForId<T>);
    });

    // Cleanup on unmount or entityId change
    return () => {
      console.log(`[useEntity] Unsubscribing from ${entityId}`);
      unsubscribe();
    };
  }, [entityId, store.subscribeToEntity]);

  return entity;
}

/**
 * Get access to the full hass object for calling services, accessing config, etc.
 * Note: This does NOT re-render on entity changes. Use useEntity for that.
 * 
 * @returns Object with getHass() function to get current hass value
 */
export function useHass(): { getHass: () => HomeAssistant | undefined } {
  const store = useHAStore();
  return { getHass: store.getHass };
}

// ============================================================================
// Calendar Events Hook
// ============================================================================

interface UseCalendarEventsResult {
  events: CalendarEvent[] | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Fetch calendar events for a date range.
 * 
 * @param entityId Calendar entity ID (e.g., 'calendar.family')
 * @param options Date range to fetch events for
 * @returns Events array, loading state, error, and refetch function
 */
export function useCalendarEvents(
  entityId: `calendar.${string}`,
  options: { start: Date; end: Date }
): UseCalendarEventsResult {
  const { getHass } = useHass();
  const [events, setEvents] = useState<CalendarEvent[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  // Track current fetch to avoid race conditions
  const fetchIdRef = useRef(0);

  const fetchEvents = useCallbackStable(async () => {
    const hass = getHass();
    if (!hass?.connection) {
      setError(new Error('Home Assistant connection not available'));
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(undefined);

    try {
      // Use call_service pattern since calendar/get_events is a service
      const result = await hass.connection.sendMessagePromise<{
        response: { [entityId: string]: { events: CalendarEvent[] } };
      }>({
        type: 'call_service',
        domain: 'calendar',
        service: 'get_events',
        service_data: {
          start_date_time: options.start.toISOString(),
          end_date_time: options.end.toISOString(),
        },
        target: { entity_id: entityId },
        return_response: true,
      });

      // Only update if this is still the latest fetch
      if (fetchId === fetchIdRef.current) {
        const entityEvents = result.response?.[entityId]?.events ?? [];
        setEvents(entityEvents);
        setLoading(false);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  });

  // Fetch when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [entityId, options.start.getTime(), options.end.getTime(), fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

// ============================================================================
// Multi-Calendar Events Hook
// ============================================================================

interface UseMultiCalendarEventsResult {
  events: CalendarEventWithSource[] | undefined;
  loading: boolean;
  refreshing: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Fetch calendar events from multiple calendars for a date range.
 * Events are returned with their source calendarId attached.
 * 
 * @param entityIds Array of calendar entity IDs (e.g., ['calendar.family', 'calendar.work'])
 * @param options Date range to fetch events for
 * @returns Events array with calendarId, loading state, error, and refetch function
 */
export function useMultiCalendarEvents(
  entityIds: `calendar.${string}`[],
  options: { start: Date; end: Date }
): UseMultiCalendarEventsResult {
  const store = useHAStore();
  const { getHass } = useHass();
  const [events, setEvents] = useState<CalendarEventWithSource[] | undefined>(undefined);
  const [eventsDateRangeKey, setEventsDateRangeKey] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  // Track current fetch to avoid race conditions on data updates
  const fetchIdRef = useRef(0);
  
  // Track in-flight request count for refreshing indicator
  const inFlightCountRef = useRef(0);
  
  // Debounce timer for entity change triggers
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Cache for previously loaded date ranges
  const cacheRef = useRef<Map<string, CalendarEventWithSource[]>>(new Map());
  
  // Flag to indicate cache should be cleared when next fetch completes
  const shouldInvalidateCacheRef = useRef(false);
  
  // Stable serialization of entityIds for dependency tracking
  const entityIdsKey = entityIds.join(',');
  
  // Cache key for current date range
  const dateRangeKey = `${options.start.getTime()}-${options.end.getTime()}`;

  const fetchAllEvents = useCallbackStable(async () => {
    const hass = getHass();
    if (!hass?.connection) {
      setError(new Error('Home Assistant connection not available'));
      return;
    }

    if (entityIds.length === 0) {
      setEvents([]);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    inFlightCountRef.current++;
    setRefreshing(true);
    setError(undefined);

    try {
      // Fetch all calendars in parallel
      const results = await Promise.all(
        entityIds.map(async (entityId) => {
          try {
            const result = await hass.connection.sendMessagePromise<{
              response: { [key: string]: { events: CalendarEvent[] } };
            }>({
              type: 'call_service',
              domain: 'calendar',
              service: 'get_events',
              service_data: {
                start_date_time: options.start.toISOString(),
                end_date_time: options.end.toISOString(),
              },
              target: { entity_id: entityId },
              return_response: true,
            });
            
            const calendarEvents = result.response?.[entityId]?.events ?? [];
            // Attach calendarId to each event
            return calendarEvents.map((event): CalendarEventWithSource => ({
              ...event,
              calendarId: entityId,
            }));
          } catch (err) {
            console.error(`Failed to fetch events for ${entityId}:`, err);
            return []; // Return empty array for failed calendar, don't fail everything
          }
        })
      );

      // Only update data if this is still the latest fetch
      if (fetchId === fetchIdRef.current) {
        // Flatten all events into a single array
        const allEvents = results.flat();
        // Clear cache if this was an invalidating fetch (entity changed)
        if (shouldInvalidateCacheRef.current) {
          cacheRef.current.clear();
          shouldInvalidateCacheRef.current = false;
        }
        // Cache the results for this date range
        cacheRef.current.set(dateRangeKey, allEvents);
        setEvents(allEvents);
        setEventsDateRangeKey(dateRangeKey);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      // Decrement in-flight count and clear refreshing only when all fetches complete
      inFlightCountRef.current--;
      if (inFlightCountRef.current === 0) {
        setRefreshing(false);
      }
    }
  });

  // Debounced refetch for entity changes (invalidates cache once new data arrives)
  const debouncedRefetch = useCallbackStable(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      // Mark cache for invalidation (cleared when new data arrives)
      shouldInvalidateCacheRef.current = true;
      fetchAllEvents();
    }, 500); // 500ms debounce
  });

  // Fetch when dependencies change (immediate, not debounced)
  // Skip fetch if we have valid cached data - entity changes will invalidate cache
  useEffect(() => {
    const cached = cacheRef.current.get(dateRangeKey);
    // Fetch if: no cache, OR cache is marked for invalidation (entity changed)
    if (!cached || shouldInvalidateCacheRef.current) {
      fetchAllEvents();
    }
  }, [entityIdsKey, dateRangeKey, fetchAllEvents]);

  // Invalidate cache when calendar entities change
  useEffect(() => {
    shouldInvalidateCacheRef.current = true;
  }, [entityIdsKey]);

  // Subscribe to entity changes and refetch (debounced)
  useEffect(() => {
    const unsubscribes = entityIds.map(entityId => 
      store.subscribeToEntity(entityId, debouncedRefetch)
    );
    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [entityIdsKey, store.subscribeToEntity, debouncedRefetch]);

  // Synchronously check cache for current date range (avoids flash on navigation)
  // This runs during render, so cached data is available immediately
  const cachedEvents = cacheRef.current.get(dateRangeKey);
  
  // Use cached data if available, otherwise use fetched state only if it matches current date range
  // This prevents showing stale data from a different month
  const fetchedEventsForRange = eventsDateRangeKey === dateRangeKey ? events : undefined;
  const effectiveEvents = cachedEvents ?? fetchedEventsForRange;
  
  // loading = true only when we have no data (not cached, not fetched)
  const loading = effectiveEvents === undefined && refreshing;

  return { events: effectiveEvents, loading, refreshing, error, refetch: fetchAllEvents };
}
// ============================================================================
// Weather Forecast Hook
// ============================================================================

interface UseWeatherForecastResult {
  forecast: WeatherForecast[] | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Fetch weather forecast data.
 * 
 * @param entityId Weather entity ID (e.g., 'weather.home')
 * @param type Forecast type: 'daily', 'hourly', or 'twice_daily'
 * @returns Forecast array, loading state, error, and refetch function
 */
export function useWeatherForecast(
  entityId: `weather.${string}`,
  type: ForecastType
): UseWeatherForecastResult {
  const store = useHAStore();
  const { getHass } = useHass();
  const [forecast, setForecast] = useState<WeatherForecast[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  // Track current fetch to avoid race conditions
  const fetchIdRef = useRef(0);
  
  // Debounce timer for entity change triggers
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Timer for hourly refetch
  const hourlyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchForecast = useCallbackStable(async () => {
    const hass = getHass();
    if (!hass?.connection) {
      setError(new Error('Home Assistant connection not available'));
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(undefined);

    try {
      // Use call_service pattern since weather/get_forecasts is a service
      const result = await hass.connection.sendMessagePromise<{
        response: { [entityId: string]: { forecast: WeatherForecast[] } };
      }>({
        type: 'call_service',
        domain: 'weather',
        service: 'get_forecasts',
        service_data: { type: type },
        target: { entity_id: entityId },
        return_response: true,
      });

      // Only update if this is still the latest fetch
      if (fetchId === fetchIdRef.current) {
        const entityForecast = result.response?.[entityId]?.forecast ?? [];
        setForecast(entityForecast);
        setLoading(false);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  });

  // Debounced refetch for entity changes
  const debouncedRefetch = useCallbackStable(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      console.log(`[useWeatherForecast] Entity ${entityId} changed, refetching ${type} forecast`);
      fetchForecast();
    }, 500); // 500ms debounce
  });

  // Schedule next hourly refetch at the top of the hour
  const scheduleHourlyRefetch = useCallbackStable(() => {
    if (hourlyTimerRef.current) {
      clearTimeout(hourlyTimerRef.current);
    }
    
    // Calculate milliseconds until the next hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();
    
    console.log(`[useWeatherForecast] Scheduling next ${type} forecast refetch in ${Math.round(msUntilNextHour / 1000 / 60)} minutes`);
    
    hourlyTimerRef.current = setTimeout(() => {
      console.log(`[useWeatherForecast] Hourly timer triggered, refetching ${type} forecast`);
      fetchForecast();
      // Schedule the next refetch after this one completes
      scheduleHourlyRefetch();
    }, msUntilNextHour);
  });

  // Fetch when dependencies change
  useEffect(() => {
    fetchForecast();
    // Schedule hourly refetch after initial fetch
    scheduleHourlyRefetch();
  }, [entityId, type, fetchForecast, scheduleHourlyRefetch]);

  // Subscribe to entity changes and refetch (debounced)
  useEffect(() => {
    console.log(`[useWeatherForecast] Subscribing to ${entityId} for ${type} forecast updates`);
    const unsubscribe = store.subscribeToEntity(entityId, debouncedRefetch);
    
    return () => {
      console.log(`[useWeatherForecast] Unsubscribing from ${entityId}`);
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (hourlyTimerRef.current) {
        clearTimeout(hourlyTimerRef.current);
      }
    };
  }, [entityId, store.subscribeToEntity, debouncedRefetch]);

  return { forecast, loading, error, refetch: fetchForecast };
}
