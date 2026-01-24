// ============================================================================
// Daily Weather Chart
// A visual representation of daily weather forecast with rich visual elements
// ============================================================================

import type { JSX } from 'preact';
import type { WeatherForecast, SunTimes } from './WeatherContext';
import {
  getTemperatureColor,
  getPrecipitationAmount,
  getPrecipitationProbability,
  getPrecipitationType,
  getPrecipitationSize,
  getPrecipitationOpacity,
} from './weatherUtils';
import { Raindrop, Snowflake } from './WeatherSvgElements';

// ============================================================================
// Types
// ============================================================================

interface DailyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  latitude: number | undefined;
  maxItems?: number;
  precipitationUnit: string;
}

// ============================================================================
// Constants
// ============================================================================

// Weather icon mapping (MDI icons)
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

// ============================================================================
// Helper Functions
// ============================================================================

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

function getWeatherIcon(condition: string | undefined): string {
  if (!condition) return 'mdi:weather-cloudy';
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

// ============================================================================
// Precipitation Component
// ============================================================================

interface DailyPrecipitationProps {
  item: WeatherForecast;
  x: number;
  y: number;
  width: number;
  height: number;
  precipitationUnit: string;
}

function DailyPrecipitation({ item, x, y, width, height, precipitationUnit }: DailyPrecipitationProps) {
  const precipType = getPrecipitationType(item.condition);
  const precipAmount = getPrecipitationAmount(item.precipitation);
  const precipProb = getPrecipitationProbability(item.precipitation_probability);
  
  if (!precipType || precipAmount === 0) return null;
  
  const size = Math.min(getPrecipitationSize(precipAmount) * 0.7, 5);
  const opacity = getPrecipitationOpacity(precipProb);
  const numDrops = Math.min(Math.ceil(precipAmount * 2), 5);
  
  // Format precipitation amount (round to 1 decimal place)
  const formattedAmount = precipAmount.toFixed(1);
  
  const elements: JSX.Element[] = [];
  
 
  
  for (let i = 0; i < numDrops; i++) {
    const dropX = x + width * (0.2 + (i * 0.6) / numDrops);
    const dropY = y - 8 + height * (0.3 + (i % 3) * 0.2);
    
    if (precipType === 'snow') {
      elements.push(
        <Snowflake key={`snow-${i}`} x={dropX} y={dropY} size={size} opacity={opacity} />
      );
    } else if (precipType === 'rain') {
      elements.push(
        <Raindrop key={`rain-${i}`} x={dropX} y={dropY} size={size} opacity={opacity} />
      );
    } else {
      // Mixed
      if (i % 2 === 0) {
        elements.push(
          <Raindrop key={`rain-${i}`} x={dropX} y={dropY} size={size} opacity={opacity} />
        );
      } else {
        elements.push(
          <Snowflake key={`snow-${i}`} x={dropX} y={dropY} size={size} opacity={opacity} />
        );
      }
    }
  }
  
   // Add precipitation amount text above icons
  elements.push(
    <foreignObject
      key="precip-text"
      x={x + width / 2 - 20}
      y={y - 8}
      width={40}
      height={12}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-text-color, #fff)',
          fontSize: '0.5em',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {formattedAmount} {precipitationUnit}
      </div>
    </foreignObject>
  );

  return <g>{elements}</g>;
}

// ============================================================================
// Day Column Component
// ============================================================================

interface DayColumnProps {
  item: WeatherForecast;
  x: number;
  width: number;
  minTemp: number;
  maxTemp: number;
  viewHeight: number;
  index: number;
  precipitationUnit: string;
}

function DayColumn({
  item,
  x,
  width,
  minTemp,
  maxTemp,
  viewHeight,
  index,
  precipitationUnit,
}: DayColumnProps) {
  const centerX = x + width / 2;
  const high = item.temperature ?? 50;
  const low = item.templow ?? high - 10;
  
  // Get temperature colors
  const highColor = getTemperatureColor(high);
  const lowColor = getTemperatureColor(low);
  
  // Layout zones
  const padding = 3;
  const headerHeight = 30;      // Day label + condition icon
  const precipLayerHeight = 18; // Precipitation elements above bar
  const tempLabelHeight = 20;   // Space for labels
  
  // Calculate positions
  const contentTop = headerHeight;
  const contentHeight = viewHeight - headerHeight - tempLabelHeight - padding * 2;
  
  // Temperature bar area (below precip layer)
  const tempBarTop = contentTop + precipLayerHeight;
  const tempBarHeight = contentHeight - precipLayerHeight - 5;
  const tempRange = maxTemp - minTemp || 1;
  
  // Calculate bar positions (inverted because SVG y increases downward)
  const highY = tempBarTop + ((maxTemp - high) / tempRange) * tempBarHeight;
  const lowY = tempBarTop + ((maxTemp - low) / tempRange) * tempBarHeight;
  const barHeight = lowY - highY;
  
  // ClipPath ID for temperature bar - use index for uniqueness
  const clipId = `temp-clip-${index}-${item.datetime}`;
  
  // CSS gradient for temperature (vertical: high at top, low at bottom)
  const tempGradientStyle = {
    background: `linear-gradient(to bottom, ${highColor}, ${lowColor})`,
    width: `${width - padding * 2}px`,
    height: `${Math.max(barHeight, 4)}px`,
    borderRadius: '4px',
  };
  
  const iconSize = 24;
  const iconY = 27;
  
  return (
    <g>
      {/* Day label - using foreignObject with CSS */}
      <foreignObject
        x={centerX - 30}
        y={4}
        width={60}
        height={16}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary-text-color, #aaa)',
            fontSize: '0.75em',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {formatDay(item.datetime)}
        </div>
      </foreignObject>
      
      {/* Condition icon - using ha-icon */}
      <foreignObject
        x={centerX - iconSize / 2}
        y={iconY - iconSize / 2}
        width={iconSize}
        height={iconSize + 5}
      >
        <ha-icon
          icon={getWeatherIcon(item.condition)}
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            color: 'var(--primary-text-color, #fff)',
          }}
        />
      </foreignObject>
      
      {/* Precipitation - above the temperature bar */}
      <DailyPrecipitation
        item={item}
        x={x + padding}
        y={contentTop + 27}
        width={width - padding * 2}
        height={precipLayerHeight}
        precipitationUnit={precipitationUnit}
      />
      
      {/* Temperature bar clip path */}
      <defs>
        <clipPath id={clipId}>
          <rect
            x={x + padding}
            y={highY}
            width={width - padding * 2}
            height={Math.max(barHeight, 4)}
            rx={4}
          />
        </clipPath>
      </defs>
      
      {/* Temperature bar - CSS gradient with clipPath */}
      <g clip-path={`url(#${clipId})`}>
        <foreignObject
          x={x + padding}
          y={highY}
          width={width - padding * 2}
          height={Math.max(barHeight, 4)}
        >
          <div style={tempGradientStyle} />
        </foreignObject>
      </g>
      
      {/* High temp label - at the top of the bar - using foreignObject with CSS */}
      <foreignObject
        x={centerX - 20}
        y={highY - 14}
        width={40}
        height={12}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-text-color, #fff)',
            fontSize: '0.75em',
            fontWeight: '600',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {Math.round(high)}°
        </div>
      </foreignObject>
      
      {/* Low temp label - at the bottom of the bar - using foreignObject with CSS */}
      <foreignObject
        x={centerX - 20}
        y={lowY + 2}
        width={40}
        height={12}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary-text-color, #aaa)',
            fontSize: '0.75em',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {Math.round(low)}°
        </div>
      </foreignObject>
    </g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DailyChart({ forecast, sunTimes: _sunTimes, latitude: _latitude, maxItems = 7, precipitationUnit }: DailyChartProps) {
  // Filter out today's forecast
  const today = new Date();
  const filteredForecast = forecast.filter(item => {
    const itemDate = new Date(item.datetime);
    return itemDate.toDateString() !== today.toDateString();
  });
  
  const items = filteredForecast.slice(0, maxItems);
  
  if (items.length === 0) {
    return null;
  }
  
  // Chart dimensions
  const viewWidth = 400;
  const viewHeight = 160;
  const padding = { left: 10, right: 10 };
  
  const contentWidth = viewWidth - padding.left - padding.right;
  
  // Calculate column width
  const columnWidth = contentWidth / items.length;
  
  // Calculate centering offset if needed
  const totalColumnsWidth = columnWidth * items.length;
  const centeringOffset = (contentWidth - totalColumnsWidth) / 2;
  
  // Calculate min/max temps across all days for consistent bar scaling
  const allTemps: number[] = [];
  items.forEach(item => {
    if (item.temperature !== undefined) allTemps.push(item.temperature);
    if (item.templow !== undefined) allTemps.push(item.templow);
  });
  
  const minTemp = Math.min(...allTemps) - 5;
  const maxTemp = Math.max(...allTemps) + 5;
  
  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      class="daily-chart"
      style={{ width: '100%', height: 'auto', minHeight: '120px' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Base background - neutral card color */}
      <rect
        x={0}
        y={0}
        width={viewWidth}
        height={viewHeight}
        fill="var(--ha-card-background, var(--card-background-color, #1c1c1c))"
        rx={8}
      />
      
      {/* Day columns - centered */}
      <g transform={`translate(${padding.left + centeringOffset}, 0)`}>
        {items.map((item, i) => (
          <DayColumn
            key={i}
            item={item}
            x={i * columnWidth}
            width={columnWidth}
            minTemp={minTemp}
            maxTemp={maxTemp}
            viewHeight={viewHeight}
            index={i}
            precipitationUnit={precipitationUnit}
          />
        ))}
      </g>
    </svg>
  );
}
