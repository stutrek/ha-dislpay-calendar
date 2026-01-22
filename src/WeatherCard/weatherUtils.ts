// ============================================================================
// Weather Utilities
// Color calculations, temperature mapping, and default value helpers
// ============================================================================

import type { SunTimes } from './WeatherContext';

// ============================================================================
// Types
// ============================================================================

export type GroundType = 'ice' | 'puddles' | 'sand' | 'seasonal' | null;
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Conditions that indicate rain
const RAINY_CONDITIONS = new Set([
  'rainy',
  'pouring',
  'lightning-rainy',
  'snowy-rainy',
]);

// Conditions that are considered "nice weather" for seasonal ground display
const NICE_CONDITIONS = new Set([
  'sunny',
  'partlycloudy',
  'clear-night',
]);

// ============================================================================
// Default Value Helpers
// ============================================================================

/**
 * Get precipitation probability, defaulting to 100% if not provided
 */
export function getPrecipitationProbability(probability: number | undefined): number {
  return probability ?? 100;
}

/**
 * Get cloud coverage, defaulting to 50% if not provided
 */
export function getCloudCoverage(coverage: number | undefined): number {
  return coverage ?? 50;
}

/**
 * Get precipitation amount, defaulting to 0
 */
export function getPrecipitationAmount(amount: number | undefined): number {
  return amount ?? 0;
}

/**
 * Get wind speed, defaulting to 0
 */
export function getWindSpeed(speed: number | undefined): number {
  return speed ?? 0;
}

// ============================================================================
// Sky Color Calculations
// ============================================================================

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Sky colors
const SKY_COLORS = {
  daySunny: '#87CEEB',      // Sky blue
  dayCloudy: '#708090',     // Slate grey
  nightClear: '#0a1628',    // Deep navy
  nightCloudy: '#1a1a1a',   // Near black
  dawn: '#ffb347',          // Orange-pink
  dusk: '#ff8c42',          // Orange sunset
};

/**
 * Calculate the sky color for a given datetime and conditions
 */
export function getSkyColor(
  datetime: Date,
  cloudCoverage: number,
  sunTimes: SunTimes
): string {
  const { sunrise, sunset, dawn, dusk } = sunTimes;
  
  // If we don't have sun times, use time-based approximation
  const hour = datetime.getHours();
  
  // Calculate time of day factor
  let timeOfDayFactor: 'day' | 'night' | 'dawn' | 'dusk' = 'day';
  
  if (sunrise && sunset && dawn && dusk) {
    const time = datetime.getTime();
    const sunriseTime = sunrise.getTime();
    const sunsetTime = sunset.getTime();
    const dawnTime = dawn.getTime();
    const duskTime = dusk.getTime();
    
    // Note: HA's sun entity gives "next_" times, so we need to handle wrap-around
    // For simplicity, we'll check relative positions
    if (time >= dawnTime && time < sunriseTime) {
      timeOfDayFactor = 'dawn';
    } else if (time >= sunriseTime && time < sunsetTime) {
      timeOfDayFactor = 'day';
    } else if (time >= sunsetTime && time < duskTime) {
      timeOfDayFactor = 'dusk';
    } else {
      timeOfDayFactor = 'night';
    }
  } else {
    // Fallback to hour-based approximation
    if (hour >= 5 && hour < 7) {
      timeOfDayFactor = 'dawn';
    } else if (hour >= 7 && hour < 18) {
      timeOfDayFactor = 'day';
    } else if (hour >= 18 && hour < 20) {
      timeOfDayFactor = 'dusk';
    } else {
      timeOfDayFactor = 'night';
    }
  }
  
  // Normalize cloud coverage to 0-1
  const cloudFactor = Math.min(1, Math.max(0, cloudCoverage / 100));
  
  // Calculate base color based on time of day
  let baseColor: string;
  
  switch (timeOfDayFactor) {
    case 'dawn':
      // Dawn is orange-ish, affected by clouds
      baseColor = interpolateColor(SKY_COLORS.dawn, SKY_COLORS.dayCloudy, cloudFactor * 0.5);
      break;
    case 'dusk':
      // Dusk is orange, affected by clouds
      baseColor = interpolateColor(SKY_COLORS.dusk, SKY_COLORS.dayCloudy, cloudFactor * 0.5);
      break;
    case 'night':
      // Night is dark, darker when cloudy
      baseColor = interpolateColor(SKY_COLORS.nightClear, SKY_COLORS.nightCloudy, cloudFactor);
      break;
    case 'day':
    default:
      // Day transitions from blue to grey based on clouds
      baseColor = interpolateColor(SKY_COLORS.daySunny, SKY_COLORS.dayCloudy, cloudFactor);
      break;
  }
  
  return baseColor;
}

/**
 * Determine if it's currently daytime based on datetime and sun times
 */
export function isDaytime(datetime: Date, sunTimes: SunTimes): boolean {
  const { sunrise, sunset } = sunTimes;
  
  if (sunrise && sunset) {
    const time = datetime.getTime();
    return time >= sunrise.getTime() && time < sunset.getTime();
  }
  
  // Fallback to hour-based approximation
  const hour = datetime.getHours();
  return hour >= 6 && hour < 20;
}

// ============================================================================
// Temperature Color Calculations
// ============================================================================

const TEMP_COLORS = {
  hot: '#ff6b6b',       // Red-orange (>90F)
  warm: '#ffa94d',      // Orange (70-90F)
  mild: '#69db7c',      // Green (50-70F)
  cool: '#74c0fc',      // Light blue (32-50F)
  cold: '#339af0',      // Blue (<32F)
  freezing: '#1c7ed6',  // Deep blue (very cold)
};

/**
 * Get the color for a temperature value (for gradient fill)
 */
export function getTemperatureColor(tempF: number): string {
  if (tempF > 90) return TEMP_COLORS.hot;
  if (tempF > 89) return interpolateColor(TEMP_COLORS.warm, TEMP_COLORS.hot, (tempF - 89) / 20);
  if (tempF > 60) return interpolateColor(TEMP_COLORS.mild, TEMP_COLORS.warm, (tempF - 60) / 20);
  if (tempF > 32) return interpolateColor(TEMP_COLORS.cool, TEMP_COLORS.mild, (tempF - 32) / 18);
  if (tempF > 0) return interpolateColor(TEMP_COLORS.cold, TEMP_COLORS.cool, tempF / 32);
  return TEMP_COLORS.freezing;
}

// ============================================================================
// Ground Layer Calculations
// ============================================================================

/**
 * Determine which ground type to display based on conditions.
 * Priority: ice > puddles > sand > seasonal > null
 */
export function getGroundType(
  tempF: number,
  precipitation: number,
  condition: string | undefined,
  probability: number,
  _latitude: number | undefined
): GroundType {
  // 1. Freezing - always show ice
  if (tempF <= 32) {
    return 'ice';
  }
  
  // 2. Rainy + above freezing - show puddles
  const isRainy = RAINY_CONDITIONS.has(condition ?? '') || 
    (precipitation > 0 && probability > 20);
  if (isRainy) {
    return 'puddles';
  }
  
  // 3. Hot - show sand
  if (tempF >= 90) {
    return 'sand';
  }
  
  // 4. Nice weather - show seasonal elements
  if (isNiceWeather(condition, tempF, probability)) {
    return 'seasonal';
  }
  
  // 5. Default - nothing
  return null;
}

/**
 * Check if conditions qualify as "nice weather" for seasonal ground display
 * Nice weather: sunny or partly cloudy, 55-85F, <20% precip chance
 */
export function isNiceWeather(
  condition: string | undefined,
  tempF: number,
  probability: number
): boolean {
  const isNiceCondition = NICE_CONDITIONS.has(condition ?? '');
  const isNiceTemp = tempF >= 55 && tempF <= 85;
  const isLowPrecip = probability < 20;
  
  return isNiceCondition && isNiceTemp && isLowPrecip;
}

/**
 * Get ice intensity (0-1) based on temperature.
 * 32F = 0 (subtle), -10F = 1 (maximum)
 */
export function getIceIntensity(tempF: number): number {
  if (tempF > 32) return 0;
  // Scale from 32F (0) to -10F (1)
  const intensity = (32 - tempF) / 42;
  return Math.min(1, Math.max(0, intensity));
}

/**
 * Get ice jaggedness height in pixels based on intensity.
 * Ranges from 3-5px (subtle frost) to 30px+ (dramatic spikes)
 */
export function getIceHeight(intensity: number): number {
  // Map 0-1 intensity to 4-30px
  return 4 + intensity * 26;
}

/**
 * Get ice color based on intensity.
 * Light frost white to icy blue
 */
export function getIceColor(intensity: number): string {
  return interpolateColor('#e3f2fd', '#1565c0', intensity);
}

/**
 * Get sand intensity (0-1) based on temperature.
 * 90F = 0 (subtle), 110F = 1 (intense)
 */
export function getSandIntensity(tempF: number): number {
  if (tempF < 90) return 0;
  // Scale from 90F (0) to 110F (1)
  const intensity = (tempF - 90) / 20;
  return Math.min(1, Math.max(0, intensity));
}

/**
 * Get puddle intensity (0-1) based on precipitation amount.
 * 0mm = 0, 5mm+ = 1
 */
export function getPuddleIntensity(precipitation: number): number {
  // Scale from 0 (0) to 5mm (1)
  const intensity = precipitation / 5;
  return Math.min(1, Math.max(0, intensity));
}

// ============================================================================
// Season Calculations
// ============================================================================

/**
 * Get the current season based on date and hemisphere (determined by latitude).
 * Positive latitude = Northern hemisphere
 * Negative latitude = Southern hemisphere
 */
export function getSeason(date: Date, latitude: number | undefined): Season {
  const month = date.getMonth(); // 0-11
  
  // Default to northern hemisphere if latitude unknown
  const isNorthern = (latitude ?? 40) >= 0;
  
  // Northern hemisphere seasons
  let season: Season;
  if (month >= 2 && month <= 4) {
    season = 'spring'; // Mar-May
  } else if (month >= 5 && month <= 7) {
    season = 'summer'; // Jun-Aug
  } else if (month >= 8 && month <= 10) {
    season = 'fall'; // Sep-Nov
  } else {
    season = 'winter'; // Dec-Feb
  }
  
  // Flip for southern hemisphere
  if (!isNorthern) {
    const seasonFlip: Record<Season, Season> = {
      spring: 'fall',
      summer: 'winter',
      fall: 'spring',
      winter: 'summer',
    };
    season = seasonFlip[season];
  }
  
  return season;
}

// ============================================================================
// Precipitation Calculations
// ============================================================================

/**
 * Get precipitation drop/flake size based on amount.
 * Returns size in pixels.
 */
export function getPrecipitationSize(amountMm: number): number {
  if (amountMm <= 0) return 0;
  if (amountMm <= 0.5) return 3;
  if (amountMm <= 2) return 5;
  if (amountMm <= 5) return 8;
  return 12;
}

/**
 * Get precipitation opacity based on probability.
 * Default 100% if not provided.
 */
export function getPrecipitationOpacity(probability: number | undefined): number {
  const prob = getPrecipitationProbability(probability);
  if (prob <= 30) return 0.3;
  if (prob <= 60) return 0.5;
  if (prob <= 90) return 0.7;
  return 1.0;
}

/**
 * Determine precipitation type based on condition
 */
export function getPrecipitationType(condition: string | undefined): 'rain' | 'snow' | 'mixed' | null {
  if (!condition) return null;
  
  if (condition === 'snowy') return 'snow';
  if (condition === 'snowy-rainy') return 'mixed';
  if (condition === 'hail') return 'mixed';
  if (RAINY_CONDITIONS.has(condition)) return 'rain';
  
  return null;
}

// ============================================================================
// Wind Calculations
// ============================================================================

/**
 * Get number of wind arrows based on wind speed.
 * Returns 0 for calm, 1-6+ for increasing wind.
 */
export function getWindArrowCount(speedMph: number): number {
  if (speedMph < 5) return 0;
  if (speedMph < 10) return 1;
  if (speedMph < 20) return 2;
  if (speedMph < 30) return 4;
  return 6;
}

/**
 * Get wind intensity (0-1) for styling purposes
 */
export function getWindIntensity(speedMph: number): number {
  // Scale from 5mph (0) to 40mph (1)
  if (speedMph < 5) return 0;
  const intensity = (speedMph - 5) / 35;
  return Math.min(1, Math.max(0, intensity));
}

// ============================================================================
// Chart Layout Helpers
// ============================================================================

/**
 * Calculate the Y position for a temperature value within the chart area.
 * Returns a value between 0 (top) and 1 (bottom) of the chart area.
 */
export function getTempYPosition(
  temp: number,
  minTemp: number,
  maxTemp: number
): number {
  const range = maxTemp - minTemp || 1;
  // Invert because SVG Y increases downward
  return 1 - (temp - minTemp) / range;
}

/**
 * Create a smooth curve path through temperature points using Catmull-Rom spline
 */
export function createTemperaturePath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length < 2) return '';
  
  // For 2 points, just draw a line
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  
  // Use Catmull-Rom to Bezier conversion for smooth curves
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Catmull-Rom to Bezier control points
    const tension = 0.5;
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return path;
}

/**
 * Create a closed path for the temperature fill area
 */
export function createTemperatureFillPath(
  points: Array<{ x: number; y: number }>,
  bottomY: number
): string {
  if (points.length < 2) return '';
  
  const linePath = createTemperaturePath(points);
  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  
  // Close the path by going down, across the bottom, and back up
  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}
