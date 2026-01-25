// ============================================================================
// Canvas Helpers for WeatherCard2
// Functions for drawing weather visualizations on canvas
// ============================================================================

import type { WeatherForecast, SunTimes } from '../WeatherContext';

// ============================================================================
// Color Palette
// ============================================================================

const COLORS = {
  dayClear: '#5FB3F6',      // Bright sky blue
  dayCloudy: '#8A97A8',     // Cool grey
  nightClear: '#2D1B4E',    // Deep violet
  nightCloudy: '#1A1F2E',   // Dark charcoal
};

/**
 * Get color for a temperature value (0°F to 104°F extended range)
 * Uses smooth interpolation between key temperature points
 */
export function getTemperatureColor(temp: number): string {
  // Define key temperature points and their colors
  const tempColorStops = [
    { temp: 0, color: '#6666cc' },    // Deep purple
    { temp: 10, color: '#8888ff' },   // Freezing purple
    { temp: 20, color: '#6677ff' },   // Ice blue
    { temp: 30, color: '#66aaff' },   // Cold blue
    { temp: 40, color: '#44bbff' },   // Cool blue
    { temp: 50, color: '#66cc99' },   // Cool green
    { temp: 60, color: '#88dd88' },   // Mild green
    { temp: 70, color: '#ffee44' },   // Warm yellow
    { temp: 80, color: '#ffbb44' },   // Mild orange
    { temp: 90, color: '#ff8844' },   // Warm orange
    { temp: 100, color: '#ff4444' },  // Hot red
    { temp: 104, color: '#cc0000' },  // Deep red
  ];
  
  // Handle edge cases
  if (temp <= tempColorStops[0].temp) {
    return tempColorStops[0].color;
  }
  if (temp >= tempColorStops[tempColorStops.length - 1].temp) {
    return tempColorStops[tempColorStops.length - 1].color;
  }
  
  // Find the two color stops to interpolate between
  for (let i = 0; i < tempColorStops.length - 1; i++) {
    const lower = tempColorStops[i];
    const upper = tempColorStops[i + 1];
    
    if (temp >= lower.temp && temp <= upper.temp) {
      // Calculate interpolation factor (0 to 1)
      const factor = (temp - lower.temp) / (upper.temp - lower.temp);
      return interpolateColor(lower.color, upper.color, factor);
    }
  }
  
  // Fallback (should never reach here)
  return tempColorStops[0].color;
}

// ============================================================================
// Weather Icon Mapping
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
  clear: 'mdi:weather-sunny',
};

/**
 * Get MDI weather icon name for a condition
 */
export function getWeatherIcon(condition: string | undefined): string {
  if (!condition) return 'mdi:weather-cloudy';
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

/**
 * Get MDI weather icon name for a condition at a specific time
 * Automatically uses night variants when available
 */
export function getWeatherIconForTime(
  condition: string | undefined,
  datetime: string,
  sunTimes: SunTimes
): string {
  if (!condition) return 'mdi:weather-cloudy';
  
  // Check if it's nighttime
  const isNight = !isDaytime(datetime, sunTimes);
  
  // If nighttime, check for a -night variant in the map
  if (isNight) {
    const nightVariant = `${condition}-night`;
    if (WEATHER_ICONS[nightVariant]) {
      return WEATHER_ICONS[nightVariant];
    }
  }
  
  // Fall back to regular icon
  return WEATHER_ICONS[condition] ?? 'mdi:weather-cloudy';
}

// ============================================================================
// Temperature Position Calculator
// ============================================================================

/**
 * Create a temperature positioning utility that can be shared between
 * canvas drawing and React component positioning
 */
export function createTemperaturePositioner(
  forecast: WeatherForecast[],
  canvasHeight: number,
  pixelsPerDegree: number
) {
  const temps = forecast.map(f => f.temperature ?? 0);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp;
  const heightNeeded = tempRange * pixelsPerDegree;
  const verticalPadding = Math.max(0, (canvasHeight - heightNeeded) / 2);
  
  return {
    getTempY: (temp: number): number => {
      if (tempRange === 0) return canvasHeight / 2;
      return verticalPadding + (maxTemp - temp) * pixelsPerDegree;
    },
    minTemp,
    maxTemp,
    tempRange,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if a given datetime is during daytime based on sunrise/sunset
 */
function isDaytime(datetime: string, sunTimes: SunTimes): boolean {
  const date = new Date(datetime);
  const time = date.getTime();
  
  // Default to daytime if sun times not available
  if (!sunTimes.sunrise || !sunTimes.sunset) {
    const hour = date.getHours();
    return hour >= 6 && hour < 18;
  }
  
  const sunrise = sunTimes.sunrise.getTime();
  const sunset = sunTimes.sunset.getTime();
  
  return time >= sunrise && time < sunset;
}

/**
 * Interpolate between two hex colors based on a factor (0 to 1)
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

/**
 * Get the color for a specific hour based on cloud coverage and day/night
 */
function getHourColor(
  datetime: string,
  cloudCoverage: number | undefined,
  sunTimes: SunTimes
): string {
  const isDay = isDaytime(datetime, sunTimes);
  const coverage = (cloudCoverage ?? 50) / 100; // Convert to 0-1 range
  
  if (isDay) {
    // Interpolate between clear blue and cloudy grey
    return interpolateColor(COLORS.dayClear, COLORS.dayCloudy, coverage);
  } else {
    // Interpolate between clear violet and cloudy dark charcoal
    return interpolateColor(COLORS.nightClear, COLORS.nightCloudy, coverage);
  }
}

// ============================================================================
// Main Drawing Functions
// ============================================================================

/**
 * Draw the hourly background gradient on the canvas
 */
export function drawHourlyBackground(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  sunTimes: SunTimes
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set transparency for background
  ctx.globalAlpha = 0.8;
  
  // Create horizontal linear gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  
  // Add color stops for each hour
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1); // 0 to 1
    const color = getHourColor(hour.datetime, hour.cloud_coverage, sunTimes);
    gradient.addColorStop(position, color);
  });
  
  // Fill the entire canvas with the gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Reset alpha for subsequent drawings
  ctx.globalAlpha = 1.0;
}

/**
 * Draw the temperature line with gradient fill underneath
 */
export function drawTemperatureLine(
  canvas: HTMLCanvasElement,
  forecast: WeatherForecast[],
  pixelsPerDegree: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !forecast || forecast.length === 0) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Use shared temperature positioner
  const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);
  
  // Calculate x position for each hour
  const getHourX = (index: number): number => {
    return (index / (forecast.length - 1)) * width;
  };
  
  // Save context state
  ctx.save();
  
  // Create clip path: area under the temperature line
  ctx.beginPath();
  ctx.moveTo(0, height); // Start at bottom-left
  
  // Move along the bottom edge
  forecast.forEach((_, index) => {
    if (index === 0) {
      ctx.lineTo(0, height);
    }
  });
  
  // Follow temperature line
  forecast.forEach((hour, index) => {
    const x = getHourX(index);
    const y = getTempY(hour.temperature ?? 0);
    if (index === 0) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  // Back down to bottom-right
  ctx.lineTo(width, height);
  ctx.closePath();
  
  // Apply clip
  ctx.clip();
  
  // Create horizontal gradient for temperature colors
  const tempGradient = ctx.createLinearGradient(0, 0, width, 0);
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1);
    const color = getTemperatureColor(hour.temperature ?? 0);
    tempGradient.addColorStop(position, color);
  });
  
  // Fill the clipped area
  ctx.fillStyle = tempGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Restore context (remove clip)
  ctx.restore();
  
  // Draw the temperature line on top
  ctx.beginPath();
  forecast.forEach((hour, index) => {
    const x = getHourX(index);
    const y = getTempY(hour.temperature ?? 0);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  // Create gradient for line stroke
  const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
  forecast.forEach((hour, index) => {
    const position = index / (forecast.length - 1);
    const color = getTemperatureColor(hour.temperature ?? 0);
    lineGradient.addColorStop(position, color);
  });
  
  // Style and stroke the line
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}
