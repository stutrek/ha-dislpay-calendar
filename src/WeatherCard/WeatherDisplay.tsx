import { useState, useEffect } from 'preact/hooks';
import { useWeather } from './WeatherContext';
import { HourlyChart } from './HourlyChart';
import { DailyChart } from './DailyChart';

// ============================================================================
// Weather Icons Mapping
// ============================================================================

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

function getWeatherIcon(condition: string | undefined): string {
  if (!condition) return 'mdi:weather-cloudy';
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get rotation style for wind arrow (pointing in direction wind is going TO)
 */
function getWindArrowRotation(bearing: number | undefined): string {
  if (bearing === undefined) return 'rotate(0deg)';
  return `rotate(${bearing + 180}deg)`;
}

// ============================================================================
// Components
// ============================================================================

function CurrentTime() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return <span class="weather-time">{formatTime(time)}</span>;
}

// ============================================================================
// Main Component
// ============================================================================

export function WeatherDisplay() {
  const { entity, hourlyForecast, dailyForecast, loading, windSpeedUnit, sunTimes, latitude } = useWeather();
  
  if (loading && !entity) {
    return <div class="weather-loading">Loading weather...</div>;
  }
  
  if (!entity) {
    return <div class="weather-error">Weather entity not found</div>;
  }
  
  const attrs = entity.attributes;
  const condition = entity.state;
  const icon = getWeatherIcon(condition);
  const hasFeelsLike = attrs.apparent_temperature !== undefined;
  
  return (
    <div class="weather-display">
      {/* Title row: temp + icon on left, time on right */}
      <div>
        <div class="weather-header">
          <div class="weather-main">
            <ha-icon icon={icon} class="weather-icon-large" />
            <span class="weather-temp-large">
              {attrs.temperature !== undefined ? `${Math.round(attrs.temperature)}°` : '--'}
            </span>
            {hasFeelsLike && (
              <span class="weather-feels-like">
                {Math.round(attrs.apparent_temperature!)}°
              </span>
            )}
          </div>
          <CurrentTime />
        </div>
        
        {/* Conditions text */}
        <div class="weather-condition">{condition}</div>
      </div>
      
      {/* Details row: humidity/dewpoint and wind */}
      <div class="weather-details">
        {/* Humidity / Dewpoint */}
        <div class="weather-detail-group">
          <ha-icon icon="mdi:water-percent" />
          <span class="detail-value">{attrs.humidity ?? '--'}%</span>
          <span class="detail-separator">/</span>
          <span class="detail-value">{attrs.dew_point !== undefined ? `${Math.round(attrs.dew_point)}°` : '--'}</span>
          <ha-icon icon="mdi:thermometer-water" />
        </div>
        
        {/* Wind */}
        <div class="weather-detail-wind">
          <div class="wind-main">
            <ha-icon icon="mdi:weather-windy" />
            <span>
            <span class="detail-value">{attrs.wind_speed !== undefined ? Math.round(attrs.wind_speed) : '--'} </span>
            <span class="wind-unit">{windSpeedUnit}</span>
            </span>
            {attrs.wind_gust_speed !== undefined && (
              <span class="wind-gust">({Math.round(attrs.wind_gust_speed)})</span>
            )}
            <ha-icon 
              icon="mdi:arrow-up" 
              class="wind-arrow"
              style={{ transform: getWindArrowRotation(attrs.wind_bearing) }}
            />
          </div>
        </div>
      </div>
      
      {/* Visual hourly forecast chart */}
      {hourlyForecast && (
        <HourlyChart 
          forecast={hourlyForecast} 
          sunTimes={sunTimes}
          latitude={latitude}
          maxItems={12} 
        />
      )}
      
      {/* Visual daily forecast chart */}
      {dailyForecast && (
        <DailyChart
          forecast={dailyForecast}
          sunTimes={sunTimes}
          latitude={latitude}
          maxItems={7}
        />
      )}
    </div>
  );
}
