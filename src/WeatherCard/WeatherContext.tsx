import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  useEntity,
  useWeatherForecast,
  useHass,
  type WeatherEntity,
  type WeatherForecast,
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

export interface WeatherContextValue {
  config: WeatherConfig;
  entity: WeatherEntity | undefined;
  hourlyForecast: WeatherForecast[] | undefined;
  dailyForecast: WeatherForecast[] | undefined;
  loading: boolean;
  windSpeedUnit: string;
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
  children: ComponentChildren;
}

export function WeatherProvider({
  config,
  entity: propEntity,
  hourlyForecast: propHourlyForecast,
  dailyForecast: propDailyForecast,
  children,
}: WeatherProviderProps) {
  // Use HAContext hooks to fetch data (only runs if inside HAProvider)
  let hookEntity: WeatherEntity | undefined;
  let hookHourlyForecast: WeatherForecast[] | undefined;
  let hookDailyForecast: WeatherForecast[] | undefined;
  let hookLoading = false;
  let windSpeedUnit = 'mph';
  
  // Determine which entity to use for forecasts
  const forecastEntity = config.forecast_entity ?? config.entity;
  
  try {
    const { getHass } = useHass();
    const hass = getHass();
    windSpeedUnit = hass?.config?.unit_system?.wind_speed ?? 'mph';
    
    // Current conditions from primary entity
    hookEntity = useEntity(config.entity);
    
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
  
  const value = useMemo<WeatherContextValue>(() => ({
    config,
    entity,
    hourlyForecast,
    dailyForecast,
    loading,
    windSpeedUnit,
  }), [config, entity, hourlyForecast, dailyForecast, loading, windSpeedUnit]);
  
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
export type { WeatherEntity, WeatherForecast, ForecastType } from '../shared/HAContext';
