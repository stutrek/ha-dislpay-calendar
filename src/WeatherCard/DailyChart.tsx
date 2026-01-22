// ============================================================================
// Daily Weather Chart
// A visual representation of daily weather forecast with temperature bars
// ============================================================================

import type { JSX } from 'preact';
import type { WeatherForecast, SunTimes } from './WeatherContext';
import {
  getTemperatureColor,
  getGroundType,
  getPrecipitationSize,
  getPrecipitationOpacity,
  getPrecipitationType,
  getCloudCoverage,
  getPrecipitationAmount,
  getPrecipitationProbability,
} from './weatherUtils';
import {
  CloudShape,
  Raindrop,
  Snowflake,
} from './WeatherSvgElements';

// ============================================================================
// Types
// ============================================================================

interface DailyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  latitude: number | undefined;
  maxItems?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

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

// Weather condition icons (simplified mapping)
const CONDITION_ICONS: Record<string, string> = {
  sunny: '☀️',
  'clear-night': '🌙',
  cloudy: '☁️',
  partlycloudy: '⛅',
  rainy: '🌧️',
  pouring: '🌧️',
  snowy: '❄️',
  'snowy-rainy': '🌨️',
  fog: '🌫️',
  lightning: '⚡',
  'lightning-rainy': '⛈️',
  windy: '💨',
};

function getConditionIcon(condition: string | undefined): string {
  if (!condition) return '☁️';
  return CONDITION_ICONS[condition] ?? '☁️';
}

// ============================================================================
// Temperature Bar Component
// ============================================================================

interface TempBarProps {
  high: number;
  low: number;
  minTemp: number;
  maxTemp: number;
  x: number;
  barWidth: number;
  chartHeight: number;
}

function TempBar({ high, low, minTemp, maxTemp, x, barWidth, chartHeight }: TempBarProps) {
  const range = maxTemp - minTemp || 1;
  
  // Calculate bar positions (inverted because SVG y increases downward)
  const highY = ((maxTemp - high) / range) * chartHeight;
  const lowY = ((maxTemp - low) / range) * chartHeight;
  const barHeight = lowY - highY;
  
  // Get colors for high and low
  const highColor = getTemperatureColor(high);
  const lowColor = getTemperatureColor(low);
  
  // Gradient ID
  const gradientId = `temp-bar-gradient-${x}`;
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={highColor} />
          <stop offset="100%" stopColor={lowColor} />
        </linearGradient>
      </defs>
      
      {/* Temperature bar */}
      <rect
        x={x - barWidth / 2}
        y={highY}
        width={barWidth}
        height={Math.max(barHeight, 2)}
        rx={barWidth / 2}
        ry={barWidth / 2}
        fill={`url(#${gradientId})`}
        opacity={0.8}
      />
      
      {/* High temp marker */}
      <circle
        cx={x}
        cy={highY}
        r={4}
        fill={highColor}
        stroke="white"
        strokeWidth={1}
      />
      
      {/* Low temp marker */}
      <circle
        cx={x}
        cy={lowY}
        r={3}
        fill={lowColor}
        stroke="white"
        strokeWidth={1}
        opacity={0.8}
      />
    </g>
  );
}

// ============================================================================
// Mini Weather Indicator Component
// ============================================================================

interface MiniWeatherIndicatorProps {
  item: WeatherForecast;
  x: number;
  y: number;
  width: number;
  height: number;
}

function MiniWeatherIndicator({ item, x, y, width, height }: MiniWeatherIndicatorProps) {
  const elements: JSX.Element[] = [];
  
  // Add small clouds if cloudy
  const cloudCoverage = getCloudCoverage(item.cloud_coverage);
  if (cloudCoverage > 30) {
    const numClouds = Math.ceil((cloudCoverage / 100) * 2);
    for (let i = 0; i < numClouds; i++) {
      elements.push(
        <CloudShape
          key={`cloud-${i}`}
          x={x + width * (0.3 + i * 0.4)}
          y={y + height * 0.2}
          scale={0.25}
          opacity={0.4 + (cloudCoverage / 100) * 0.3}
        />
      );
    }
  }
  
  // Add precipitation
  const precipType = getPrecipitationType(item.condition);
  const precipAmount = getPrecipitationAmount(item.precipitation);
  const precipProb = getPrecipitationProbability(item.precipitation_probability);
  
  if (precipType && precipAmount > 0) {
    const size = Math.min(getPrecipitationSize(precipAmount) * 0.8, 6);
    const opacity = getPrecipitationOpacity(precipProb);
    const numDrops = Math.min(Math.ceil(precipAmount * 2), 4);
    
    for (let i = 0; i < numDrops; i++) {
      const dropX = x + width * (0.2 + i * 0.2);
      const dropY = y + height * (0.4 + (i % 2) * 0.2);
      
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
  }
  
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
  chartTop: number;
  chartHeight: number;
  latitude: number | undefined;
}

function DayColumn({
  item,
  x,
  width,
  minTemp,
  maxTemp,
  chartTop,
  chartHeight,
  latitude,
}: DayColumnProps) {
  const centerX = x + width / 2;
  const high = item.temperature ?? 50;
  const low = item.templow ?? high - 10;
  
  // Layout
  const labelY = 12;
  const iconY = 26;
  const indicatorHeight = 20;
  const indicatorY = chartTop - indicatorHeight - 5;
  const highTempLabelY = chartTop + chartHeight + 14;
  const lowTempLabelY = chartTop + chartHeight + 26;
  
  // Determine background tint based on conditions
  const groundType = getGroundType(
    high,
    getPrecipitationAmount(item.precipitation),
    item.condition,
    getPrecipitationProbability(item.precipitation_probability),
    latitude
  );
  
  let bgColor = 'transparent';
  let bgOpacity = 0;
  
  if (groundType === 'ice') {
    bgColor = '#e3f2fd';
    bgOpacity = 0.15;
  } else if (groundType === 'sand') {
    bgColor = '#f4d03f';
    bgOpacity = 0.1;
  } else if (groundType === 'puddles') {
    bgColor = '#4dabf7';
    bgOpacity = 0.1;
  }
  
  return (
    <g>
      {/* Background tint */}
      {bgOpacity > 0 && (
        <rect
          x={x + 2}
          y={chartTop - indicatorHeight - 10}
          width={width - 4}
          height={chartHeight + indicatorHeight + 20}
          rx={4}
          fill={bgColor}
          opacity={bgOpacity}
        />
      )}
      
      {/* Day label */}
      <text
        x={centerX}
        y={labelY}
        textAnchor="middle"
        fill="var(--secondary-text-color, #aaa)"
        fontSize="0.4em"
        fontFamily="system-ui, sans-serif"
      >
        {formatDay(item.datetime)}
      </text>
      
      {/* Condition icon */}
      <text
        x={centerX}
        y={iconY}
        textAnchor="middle"
        fontSize="0.7em"
      >
        {getConditionIcon(item.condition)}
      </text>
      
      {/* Mini weather indicator */}
      <MiniWeatherIndicator
        item={item}
        x={x}
        y={indicatorY}
        width={width}
        height={indicatorHeight}
      />
      
      {/* Temperature bar */}
      <TempBar
        high={high}
        low={low}
        minTemp={minTemp}
        maxTemp={maxTemp}
        x={centerX}
        barWidth={8}
        chartHeight={chartHeight}
      />
      
      {/* High temp label */}
      <text
        x={centerX}
        y={highTempLabelY}
        textAnchor="middle"
        fill="var(--primary-text-color, #fff)"
        fontSize="0.45em"
        fontWeight="500"
        fontFamily="system-ui, sans-serif"
      >
        {Math.round(high)}°
      </text>
      
      {/* Low temp label */}
      <text
        x={centerX}
        y={lowTempLabelY}
        textAnchor="middle"
        fill="var(--secondary-text-color, #aaa)"
        fontSize="0.4em"
        fontFamily="system-ui, sans-serif"
      >
        {Math.round(low)}°
      </text>
    </g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DailyChart({ forecast, sunTimes: _sunTimes, latitude, maxItems = 7 }: DailyChartProps) {
  const items = forecast.slice(0, maxItems);
  
  if (items.length === 0) {
    return null;
  }
  
  // Chart dimensions
  const viewWidth = 400;
  const viewHeight = 140;
  const padding = { left: 5, right: 5, top: 5, bottom: 5 };
  
  const contentWidth = viewWidth - padding.left - padding.right;
  
  // Calculate column width
  const columnWidth = contentWidth / items.length;
  
  // Calculate min/max temps across all days
  const allTemps: number[] = [];
  items.forEach(item => {
    if (item.temperature !== undefined) allTemps.push(item.temperature);
    if (item.templow !== undefined) allTemps.push(item.templow);
  });
  
  const minTemp = Math.min(...allTemps) - 5;
  const maxTemp = Math.max(...allTemps) + 5;
  
  // Chart area positioning
  const chartTop = 45; // Space for labels and icons
  const chartHeight = 50;
  
  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      class="daily-chart"
      style={{ width: '100%', height: 'auto', minHeight: '100px' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={viewWidth}
        height={viewHeight}
        fill="rgba(255, 255, 255, 0.03)"
        rx={8}
      />
      
      {/* Day columns */}
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {items.map((item, i) => (
          <DayColumn
            key={i}
            item={item}
            x={i * columnWidth}
            width={columnWidth}
            minTemp={minTemp}
            maxTemp={maxTemp}
            chartTop={chartTop}
            chartHeight={chartHeight}
            latitude={latitude}
          />
        ))}
      </g>
    </svg>
  );
}
