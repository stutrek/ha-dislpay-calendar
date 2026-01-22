// ============================================================================
// Hourly Weather Chart
// A visual, atmospheric representation of hourly weather forecast
// ============================================================================

import type { JSX } from 'preact';
import type { WeatherForecast, SunTimes } from './WeatherContext';
import {
  getSkyColor,
  getTemperatureColor,
  getGroundType,
  getPuddleIntensity,
  getSeason,
  getPrecipitationSize,
  getPrecipitationOpacity,
  getPrecipitationType,
  getCloudCoverage,
  getPrecipitationAmount,
  getPrecipitationProbability,
  getWindSpeed,
  getTempYPosition,
} from './weatherUtils';
import {
  PrecipitationGrid,
  Puddle,
} from './WeatherSvgElements';

// ============================================================================
// Types
// ============================================================================

interface HourlyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  latitude: number | undefined;
  maxItems?: number;
}

// Layout constants (as percentages of total height)
const LAYOUT = {
  cloudLayer: 0.12,      // 12% for clouds
  mainArea: 0.58,        // 58% for precip, wind, temp line (colored zone)
  bottomBar: 0.30,       // 30% for ground emoji + time labels (neutral zone)
};

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// Background Gradient Component
// ============================================================================

interface BackgroundGradientProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  width: number;
  height: number;
}

function BackgroundGradient({ forecast, sunTimes, width, height }: BackgroundGradientProps) {
  // Build CSS gradient string from sky colors
  const cssGradientStops = forecast.map((item, i) => {
    const datetime = new Date(item.datetime);
    const cloudCoverage = getCloudCoverage(item.cloud_coverage);
    const color = getSkyColor(datetime, cloudCoverage, sunTimes);
    const percent = (i / (forecast.length - 1)) * 100;
    return `${color} ${percent.toFixed(1)}%`;
  }).join(', ');
  
  const cssGradient = `linear-gradient(to right, ${cssGradientStops})`;
  
  return (
    <foreignObject x={0} y={0} width={width} height={height}>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: cssGradient,
        }}
      />
    </foreignObject>
  );
}

// ============================================================================
// Temperature Line Component
// ============================================================================

// ============================================================================
// Temperature Line Component
// Uses colored vertical strips for reliable fill rendering
// ============================================================================

interface TemperatureLineProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
  height: number;
  bottomY: number;
}

function TemperatureLine({ forecast, x, y, width, height, bottomY }: TemperatureLineProps) {
  // Calculate min/max temps for scaling
  const temps = forecast.map(f => f.temperature ?? 50);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  
  // Add padding to the range
  const tempRange = maxTemp - minTemp || 20;
  const paddedMin = minTemp - tempRange * 0.15;
  const paddedMax = maxTemp + tempRange * 0.15;
  
  // Calculate points
  const points = forecast.map((item, i) => {
    const temp = item.temperature ?? 50;
    const px = x + (i / (forecast.length - 1)) * width;
    const py = y + getTempYPosition(temp, paddedMin, paddedMax) * height;
    return { x: px, y: py, temp };
  });
  
  // Determine which temp labels to show (when temp changes at all from last label)
  const tempLabels: Array<{ x: number; y: number; temp: number; show: boolean }> = [];
  let lastShownTemp: number | null = null;
  
  points.forEach((point) => {
    const roundedTemp = Math.round(point.temp);
    const shouldShow = lastShownTemp === null || roundedTemp !== lastShownTemp;
    if (shouldShow) {
      lastShownTemp = roundedTemp;
    }
    tempLabels.push({ x: point.x, y: point.y, temp: point.temp, show: shouldShow });
  });
  
  // Create a single fill path: along the line, down to bottom, back across bottom
  const fillPathD = [
    // Start at first point
    `M ${points[0].x} ${points[0].y}`,
    // Line along all temperature points
    ...points.slice(1).map(p => `L ${p.x} ${p.y}`),
    // Down to bottom right
    `L ${points[points.length - 1].x} ${bottomY}`,
    // Across bottom to start
    `L ${points[0].x} ${bottomY}`,
    // Close path
    'Z'
  ].join(' ');
  
  // Build CSS gradient string from temperature colors
  const cssGradientStops = forecast.map((item, i) => {
    const temp = item.temperature ?? 50;
    const color = getTemperatureColor(temp);
    const percent = (i / (forecast.length - 1)) * 100;
    return `${color} ${percent.toFixed(1)}%`;
  }).join(', ');
  
  const cssGradient = `linear-gradient(to right, ${cssGradientStops})`;
  
  // Unique clip path ID
  const clipId = 'temp-fill-clip';
  
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={fillPathD} />
        </clipPath>
      </defs>
      
      {/* CSS gradient fill using foreignObject, clipped to fill shape */}
      <g clip-path={`url(#${clipId})`}>
        <foreignObject x={x} y={y} width={width} height={bottomY - y}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: cssGradient,
              opacity: 0.85,
            }}
          />
        </foreignObject>
      </g>
      
      {/* Temperature line - single continuous path */}
      <path
        d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
        fill="none"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Temperature labels (only when temp changes by >1°) */}
      {tempLabels.map((label, i) => label.show && (
        <text
          key={`label-${i}`}
          x={label.x}
          y={label.y - 6}
          textAnchor="middle"
          fill="var(--primary-text-color, #fff)"
          fontSize="0.5em"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          {Math.round(label.temp)}°
        </text>
      ))}
    </>
  );
}

// ============================================================================
// Ground Layer Component
// ============================================================================

interface GroundLayerProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
  height: number;
  latitude: number | undefined;
}

// Emoji for each ground type
const GROUND_EMOJI: Record<string, string[]> = {
  ice: ['❄️', '🧊', '❄️', '🧊', '❄️'],
  sand: ['🏜️', '☀️', '🌵', '☀️', '🏜️'],
  puddles: ['💧', '🌧️', '💧', '🌧️', '💧'],
  spring: ['🌸', '🌷', '🌼', '🌱', '🌸'],
  summer: ['🌿', '☘️', '🌻', '🌿', '🍀'],
  fall: ['🍂', '🍁', '🍂', '🍁', '🍂'],
  winter: ['🌲', '❄️', '🌲', '🎄', '🌲'],
};

function GroundLayer({ forecast, x, y, width, height, latitude }: GroundLayerProps) {
  // Determine ground type based on average/dominant conditions
  const avgTemp = forecast.reduce((sum, f) => sum + (f.temperature ?? 50), 0) / forecast.length;
  const totalPrecip = forecast.reduce((sum, f) => sum + getPrecipitationAmount(f.precipitation), 0);
  const avgProbability = forecast.reduce((sum, f) => sum + getPrecipitationProbability(f.precipitation_probability), 0) / forecast.length;
  
  // Get the most common condition
  const conditionCounts = new Map<string, number>();
  forecast.forEach(f => {
    const cond = f.condition ?? 'unknown';
    conditionCounts.set(cond, (conditionCounts.get(cond) ?? 0) + 1);
  });
  let dominantCondition = 'unknown';
  let maxCount = 0;
  conditionCounts.forEach((count, cond) => {
    if (count > maxCount) {
      maxCount = count;
      dominantCondition = cond;
    }
  });
  
  const groundType = getGroundType(avgTemp, totalPrecip, dominantCondition, avgProbability, latitude);
  
  if (!groundType) {
    return null;
  }
  
  // Get the emoji set for this ground type
  let emojiSet: string[];
  if (groundType === 'seasonal') {
    const season = getSeason(new Date(forecast[0].datetime), latitude);
    emojiSet = GROUND_EMOJI[season] ?? GROUND_EMOJI.summer;
  } else {
    emojiSet = GROUND_EMOJI[groundType] ?? [];
  }
  
  // For puddles, still use SVG puddles
  if (groundType === 'puddles') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <PuddleGroup
          width={width}
          height={height}
          intensity={getPuddleIntensity(totalPrecip)}
          isRaining={totalPrecip > 0}
        />
      </g>
    );
  }
  
  // Render emoji row
  const numEmoji = Math.min(emojiSet.length, 8);
  const spacing = width / (numEmoji + 1);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {emojiSet.slice(0, numEmoji).map((emoji, i) => (
        <text
          key={i}
          x={spacing * (i + 1)}
          y={height * 0.8}
          textAnchor="middle"
          fontSize="0.6em"
        >
          {emoji}
        </text>
      ))}
    </g>
  );
}

interface PuddleGroupProps {
  width: number;
  height: number;
  intensity: number;
  isRaining: boolean;
}

function PuddleGroup({ width, height, intensity, isRaining }: PuddleGroupProps) {
  const numPuddles = Math.floor(3 + intensity * 5);
  const puddles: JSX.Element[] = [];
  
  const seededRandom = (i: number) => {
    const x = Math.sin(i * 9999 + 333) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < numPuddles; i++) {
    const x = seededRandom(i) * width;
    const y = height * 0.5 + seededRandom(i + 100) * height * 0.4;
    const puddleWidth = 15 + seededRandom(i + 200) * 25 * intensity;
    const puddleHeight = 5 + seededRandom(i + 300) * 8 * intensity;
    
    puddles.push(
      <Puddle
        key={i}
        x={x}
        y={y}
        width={puddleWidth}
        height={puddleHeight}
        showRipples={isRaining}
      />
    );
  }
  
  return <g>{puddles}</g>;
}

// ============================================================================
// Time Labels Component
// ============================================================================

interface TimeLabelsProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
  height: number;
}

function TimeLabels({ forecast, x, y, width, height }: TimeLabelsProps) {
  return (
    <g>
      {forecast.map((item, i) => {
        const labelX = x + (i / (forecast.length - 1)) * width;
        const labelY = y + height * 0.7;
        
        return (
          <text
            key={i}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            fill="var(--secondary-text-color, #aaa)"
            fontSize="0.45em"
            fontFamily="system-ui, sans-serif"
          >
            {formatHour(item.datetime)}
          </text>
        );
      })}
    </g>
  );
}

// ============================================================================
// Hourly Precipitation Layer
// ============================================================================

interface HourlyPrecipitationProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
  height: number;
}

function HourlyPrecipitation({ forecast, x, y, width, height }: HourlyPrecipitationProps) {
  const sliceWidth = width / forecast.length;
  
  return (
    <g>
      {forecast.map((item, i) => {
        const precipType = getPrecipitationType(item.condition);
        if (!precipType) return null;
        
        const sliceX = x + i * sliceWidth;
        const size = getPrecipitationSize(getPrecipitationAmount(item.precipitation));
        const opacity = getPrecipitationOpacity(item.precipitation_probability);
        
        if (size === 0) return null;
        
        return (
          <g key={i} transform={`translate(${sliceX}, ${y})`}>
            <PrecipitationGrid
              width={sliceWidth}
              height={height}
              type={precipType}
              size={size}
              opacity={opacity}
              density={0.4 + getPrecipitationAmount(item.precipitation) * 0.1}
            />
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================
// Hourly Wind Layer
// ============================================================================

interface HourlyWindProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
}

function HourlyWind({ forecast, x, y, width }: HourlyWindProps) {
  // Only show wind indicators where wind is noticeable (>= 8 mph)
  const windPoints = forecast.map((item, i) => {
    const windSpeed = getWindSpeed(item.wind_speed);
    const px = x + (i / (forecast.length - 1)) * width;
    const bearing = item.wind_bearing ?? 0;
    // Thickness: scales from 2 to 5 based on speed (8-30 mph range)
    const thickness = 2 + Math.min((windSpeed - 8) / 8, 3);
    return { x: px, y, bearing, speed: windSpeed, thickness };
  }).filter(p => p.speed >= 8);
  
  if (windPoints.length === 0) return null;
  
  // Draw wind arrows - line with arrow head showing direction
  return (
    <g>
      {windPoints.map((point, i) => {
        // Arrow length based on thickness
        const arrowLen = 8 + point.thickness * 2;
        // Convert bearing to radians (bearing is direction wind comes FROM, so add 180 to show where it's going)
        const angle = ((point.bearing + 180) * Math.PI) / 180;
        const endX = point.x + Math.sin(angle) * arrowLen;
        const endY = point.y - Math.cos(angle) * arrowLen;
        
        // Arrow head
        const headLen = 3 + point.thickness;
        const headAngle = 0.5; // radians
        const head1X = endX - Math.sin(angle - headAngle) * headLen;
        const head1Y = endY + Math.cos(angle - headAngle) * headLen;
        const head2X = endX - Math.sin(angle + headAngle) * headLen;
        const head2Y = endY + Math.cos(angle + headAngle) * headLen;
        
        return (
          <g key={i} opacity={0.6}>
            {/* Arrow line */}
            <line
              x1={point.x}
              y1={point.y}
              x2={endX}
              y2={endY}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={point.thickness}
              strokeLinecap="round"
            />
            {/* Arrow head */}
            <path
              d={`M ${endX} ${endY} L ${head1X} ${head1Y} M ${endX} ${endY} L ${head2X} ${head2Y}`}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={point.thickness * 0.8}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================
// Hourly Cloud Layer
// ============================================================================

interface HourlyCloudsProps {
  forecast: WeatherForecast[];
  x: number;
  y: number;
  width: number;
  height: number;
}

function HourlyClouds({ forecast, x, y, width, height }: HourlyCloudsProps) {
  // Calculate average cloud coverage for the overall layer
  const avgCoverage = forecast.reduce((sum, f) => sum + getCloudCoverage(f.cloud_coverage), 0) / forecast.length;
  
  // Number of clouds based on coverage (0-100%)
  const numClouds = Math.round((avgCoverage / 100) * 8);
  
  if (numClouds === 0) return null;
  
  // Distribute clouds across width
  const spacing = width / (numClouds + 1);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {Array.from({ length: numClouds }).map((_, i) => (
        <text
          key={i}
          x={spacing * (i + 1)}
          y={height * 0.7}
          textAnchor="middle"
          fontSize="0.8em"
          opacity={0.7 + (avgCoverage / 100) * 0.3}
        >
          ☁️
        </text>
      ))}
    </g>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HourlyChart({ forecast, sunTimes, latitude, maxItems = 12 }: HourlyChartProps) {
  // Limit forecast items
  const items = forecast.slice(0, maxItems);
  
  if (items.length === 0) {
    return null;
  }
  
  // Chart dimensions
  const viewWidth = 400;
  const viewHeight = 150;
  const padding = { left: 5, right: 5, top: 5, bottom: 5 };
  
  const contentWidth = viewWidth - padding.left - padding.right;
  const contentHeight = viewHeight - padding.top - padding.bottom;
  
  // Calculate layer positions - colored zone vs neutral bottom bar
  const cloudLayerHeight = contentHeight * LAYOUT.cloudLayer;
  const mainAreaHeight = contentHeight * LAYOUT.mainArea;
  const bottomBarHeight = contentHeight * LAYOUT.bottomBar;
  
  const cloudLayerY = padding.top;
  const mainAreaY = cloudLayerY + cloudLayerHeight;
  const coloredZoneBottom = mainAreaY + mainAreaHeight; // Where the sky/fill ends
  const bottomBarY = coloredZoneBottom; // Where time labels and emoji live
  
  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      class="hourly-chart"
      style={{ width: '100%', height: 'auto', minHeight: '120px' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Neutral background for bottom bar (below colored zone) */}
      <rect
        x={0}
        y={coloredZoneBottom}
        width={viewWidth}
        height={bottomBarHeight + padding.bottom}
        fill="var(--ha-card-background, var(--card-background-color, #1c1c1c))"
      />
      
      {/* Background gradient - only covers the colored zone */}
      <BackgroundGradient
        forecast={items}
        sunTimes={sunTimes}
        width={viewWidth}
        height={coloredZoneBottom}
      />
      
      {/* Cloud layer - extends slightly above the sky */}
      <HourlyClouds
        forecast={items}
        x={padding.left}
        y={cloudLayerY - 5}
        width={contentWidth}
        height={cloudLayerHeight + 10}
      />
      
      {/* Precipitation - starts halfway into clouds, extends into main area */}
      <HourlyPrecipitation
        forecast={items}
        x={padding.left}
        y={cloudLayerY + cloudLayerHeight * 0.5}
        width={contentWidth}
        height={cloudLayerHeight * 0.5 + mainAreaHeight * 0.4}
      />
      
      {/* Temperature line with colored fill strips */}
      <TemperatureLine
        forecast={items}
        x={padding.left}
        y={mainAreaY + mainAreaHeight * 0.05}
        width={contentWidth}
        height={mainAreaHeight * 0.85}
        bottomY={coloredZoneBottom}
      />
      
      {/* Wind arrows - rendered last to be on top of everything */}
      <HourlyWind
        forecast={items}
        x={padding.left}
        y={mainAreaY + mainAreaHeight * 0.1}
        width={contentWidth}
      />
      
      {/* Ground layer emoji - in neutral bottom bar */}
      <GroundLayer
        forecast={items}
        x={padding.left}
        y={bottomBarY}
        width={contentWidth}
        height={bottomBarHeight * 0.5}
        latitude={latitude}
      />
      
      {/* Time labels - in neutral bottom bar */}
      <TimeLabels
        forecast={items}
        x={padding.left}
        y={bottomBarY + bottomBarHeight * 0.4}
        width={contentWidth}
        height={bottomBarHeight * 0.6}
      />
    </svg>
  );
}
