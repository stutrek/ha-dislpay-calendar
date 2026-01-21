import { useState, useEffect, useRef } from 'preact/hooks';
import { useWeather, type WeatherForecast } from './WeatherContext';

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

function formatHour(dateStr: string): string {
  const date = new Date(dateStr);
  const hour = date.getHours();
  const hour12 = hour % 12 || 12;
  // Only show am/pm at noon and midnight
  if (hour === 0 || hour === 12) {
    return `${hour12}${hour < 12 ? 'am' : 'pm'}`;
  }
  return String(hour12);
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tmrw';
  }
  
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

/**
 * Get rotation style for wind arrow (pointing in direction wind is going TO)
 */
function getWindArrowRotation(bearing: number | undefined): string {
  if (bearing === undefined) return 'rotate(0deg)';
  return `rotate(${bearing + 180}deg)`;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to measure element width and calculate how many forecast items fit
 * @param itemWidth - minimum width per item in pixels (default 25px for large mode)
 * @param maxItems - maximum number of items to show
 */
// Minimum item width ratio: 30px comfortable at large (21px font) = 1.43em
const MIN_ITEM_WIDTH_EM = 30 / 21;

function useForecastCount(maxItems: number): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null!);
  const [count, setCount] = useState(maxItems); // Start with max, will adjust
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const updateCount = () => {
      const containerWidth = element.clientWidth;
      if (containerWidth === 0) return;
      
      // Get font size to calculate minimum item width
      const fontSize = parseFloat(getComputedStyle(element).fontSize) || 16;
      const minItemWidth = fontSize * MIN_ITEM_WIDTH_EM;
      
      // Get computed gap from the row
      const row = element.querySelector('.forecast-row');
      const rowStyles = row ? getComputedStyle(row) : null;
      const gap = rowStyles ? parseFloat(rowStyles.gap) || 0 : 0;
      
      // Calculate how many items fit
      const effectiveItemWidth = minItemWidth + gap;
      const fitCount = Math.floor((containerWidth + gap) / effectiveItemWidth);
      const newCount = Math.min(Math.max(1, fitCount), maxItems);
      setCount(newCount);
    };
    
    // Delay initial measurement to ensure layout is complete
    requestAnimationFrame(updateCount);
    
    // Watch for size changes
    const observer = new ResizeObserver(updateCount);
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [maxItems]);
  
  return [ref, count];
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

interface HourlyForecastProps {
  forecast: WeatherForecast[];
  maxItems: number;
}

function HourlyForecast({ forecast, maxItems }: HourlyForecastProps) {
  const [ref, count] = useForecastCount(maxItems);
  const items = forecast.slice(0, count);
  
  if (items.length === 0) return null;
  
  return (
    <div class="forecast-section" ref={ref}>
      <div class="forecast-row">
        {items.map((item, i) => (
          <div key={i} class="forecast-item">
            <span class="forecast-time">{formatHour(item.datetime)}</span>
            <ha-icon icon={getWeatherIcon(item.condition)} class="forecast-icon" />
            <span class="forecast-temp">
              {item.temperature !== undefined ? `${Math.round(item.temperature)}°` : '--'}
            </span>
            {item.precipitation_probability !== undefined && item.precipitation_probability > 0 && (
              <span class="forecast-precip">{item.precipitation_probability}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DailyForecastProps {
  forecast: WeatherForecast[];
  maxItems: number;
}

function DailyForecast({ forecast, maxItems }: DailyForecastProps) {
  const [ref, count] = useForecastCount(maxItems);
  const items = forecast.slice(0, count);
  
  if (items.length === 0) return null;
  
  return (
    <div class="forecast-section" ref={ref}>
      <div class="forecast-row">
        {items.map((item, i) => (
          <div key={i} class="forecast-item forecast-item-daily">
            <span class="forecast-time">{formatDay(item.datetime)}</span>
            <ha-icon icon={getWeatherIcon(item.condition)} class="forecast-icon" />
            <div class="forecast-temps">
              <span class="forecast-temp">
                {item.temperature !== undefined ? `${Math.round(item.temperature)}°` : '--'}
              </span>
              {item.templow !== undefined && (
                <span class="forecast-temp-low">{Math.round(item.templow)}°</span>
              )}
            </div>
            {item.precipitation_probability !== undefined && item.precipitation_probability > 0 && (
              <span class="forecast-precip">{item.precipitation_probability}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WeatherDisplay() {
  const { entity, hourlyForecast, dailyForecast, loading, windSpeedUnit } = useWeather();
  
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
      
      {/* Hourly forecast - up to 12 hours based on width */}
      {hourlyForecast && <HourlyForecast forecast={hourlyForecast} maxItems={12} />}
      
      {/* Daily forecast - up to 7 days based on width */}
      {dailyForecast && <DailyForecast forecast={dailyForecast} maxItems={7} />}
    </div>
  );
}
