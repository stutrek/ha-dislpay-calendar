import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  useEntity,
  useWeatherForecast,
  useHass,
  type WeatherEntity,
  type WeatherForecast,
  type SunEntity,
} from '../shared/HAContext';

// ============================================================================
// Types
// ============================================================================

export type FontSize = 'small' | 'medium' | 'large';

export interface WeatherConfig {
  entity: `weather.${string}`;
  forecast_entity?: `weather.${string}`;
  size?: FontSize;
}

export interface SunTimes {
  sunrise: Date | undefined;
  sunset: Date | undefined;
  dawn: Date | undefined;
  dusk: Date | undefined;
}

export interface WeatherContextValue {
  config: WeatherConfig;
  entity: WeatherEntity | undefined;
  hourlyForecast: WeatherForecast[] | undefined;
  dailyForecast: WeatherForecast[] | undefined;
  loading: boolean;
  windSpeedUnit: string;
  sunTimes: SunTimes;
  latitude: number | undefined;
}

// ============================================================================
// Context
// ============================================================================

const WeatherContext = createContext<WeatherContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface WeatherProviderProps {
  config: WeatherConfig;
  // For Storybook/testing: pass data directly
  entity?: WeatherEntity;
  hourlyForecast?: WeatherForecast[];
  dailyForecast?: WeatherForecast[];
  // For Storybook/testing: pass sun times and latitude directly
  sunTimes?: SunTimes;
  latitude?: number;
  children: ComponentChildren;
}

export function WeatherProvider({
  config,
  entity: propEntity,
  hourlyForecast: propHourlyForecast,
  dailyForecast: propDailyForecast,
  sunTimes: propSunTimes,
  latitude: propLatitude,
  children,
}: WeatherProviderProps) {
  // Use HAContext hooks to fetch data (only runs if inside HAProvider)
  let hookEntity: WeatherEntity | undefined;
  let hookHourlyForecast: WeatherForecast[] | undefined;
  let hookDailyForecast: WeatherForecast[] | undefined;
  let hookLoading = false;
  let windSpeedUnit = 'mph';
  let hookSunTimes: SunTimes = { sunrise: undefined, sunset: undefined, dawn: undefined, dusk: undefined };
  let hookLatitude: number | undefined;
  
  // Determine which entity to use for forecasts
  const forecastEntity = config.forecast_entity ?? config.entity;
  
  try {
    const { getHass } = useHass();
    const hass = getHass();
    windSpeedUnit = hass?.config?.unit_system?.wind_speed ?? 'mph';
    hookLatitude = hass?.config?.latitude;
    
    // Current conditions from primary entity
    hookEntity = useEntity(config.entity);
    
    // Sun entity for sunrise/sunset times
    const sunEntity = useEntity('sun.sun') as SunEntity | undefined;
    if (sunEntity?.attributes) {
      const attrs = sunEntity.attributes;
      hookSunTimes = {
        sunrise: attrs.next_rising ? new Date(attrs.next_rising) : undefined,
        sunset: attrs.next_setting ? new Date(attrs.next_setting) : undefined,
        dawn: attrs.next_dawn ? new Date(attrs.next_dawn) : undefined,
        dusk: attrs.next_dusk ? new Date(attrs.next_dusk) : undefined,
      };
    }
    
    // Forecasts from forecast_entity (or primary entity if not specified)
    const hourlyResult = useWeatherForecast(forecastEntity, 'hourly');
    hookHourlyForecast = hourlyResult.forecast;
    hookLoading = hourlyResult.loading;
    
    const dailyResult = useWeatherForecast(forecastEntity, 'daily');
    hookDailyForecast = dailyResult.forecast;
    hookLoading = hookLoading || dailyResult.loading;
  } catch {
    // Not inside HAProvider - hooks will throw
    // This is expected when using prop data in Storybook
  }
  
  // Use prop data if provided, otherwise use hook data
  const entity = propEntity ?? hookEntity;
  const hourlyForecast = propHourlyForecast ?? hookHourlyForecast;
  const dailyForecast = propDailyForecast ?? hookDailyForecast;
  const loading = propEntity ? false : hookLoading;
  const sunTimes = propSunTimes ?? hookSunTimes;
  const latitude = propLatitude ?? hookLatitude;
  
  const value = useMemo<WeatherContextValue>(() => ({
    config,
    entity,
    hourlyForecast,
    dailyForecast,
    loading,
    windSpeedUnit,
    sunTimes,
    latitude,
  }), [config, entity, hourlyForecast, dailyForecast, loading, windSpeedUnit, sunTimes, latitude]);
  
  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}

// Re-export types from HAContext for convenience
export type { WeatherEntity, WeatherForecast, ForecastType, SunEntity } from '../shared/HAContext';
