// ============================================================================
// Daily Weather Chart
// Canvas-based daily forecast with temperature bars and precipitation
// ============================================================================

import type { JSX } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import type { WeatherForecast, SunTimes } from '../WeatherContext';
import { getWeatherIcon } from '../HourlyChart/canvasHelpers';
import { drawTemperatureBars, createBarPositioner } from './canvasHelpers';
import { drawPrecipitation } from './precipitation';

// ============================================================================
// Types
// ============================================================================

export interface DailyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  height?: number;
  minColumnWidth?: number;
  precipitationUnit?: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format date to day name (Sun, Mon, etc.)
 */
function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format precipitation amount based on unit
 */
function formatPrecipitation(amount: number | undefined, unit: string): string {
  if (!amount || amount === 0) return '';
  if (unit === 'mm') {
    return `${Math.round(amount)}mm`;
  }
  // Default to inches
  return `${amount.toFixed(1)}"`;
}

// ============================================================================
// Component
// ============================================================================

export function DailyChart({
  forecast,
  sunTimes,
  height = 120,
  minColumnWidth = 50,
  precipitationUnit = 'in',
}: DailyChartProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualColumnCount, setActualColumnCount] = useState<number>(7);

  // Draw canvas when forecast changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !forecast || forecast.length === 0) return;

    const updateCanvas = () => {
      const containerWidth = container.offsetWidth;
      const columnCount = Math.max(1, Math.min(forecast.length, Math.floor(containerWidth / minColumnWidth)));
      const columnWidth = containerWidth / columnCount;
      
      canvas.width = containerWidth;
      canvas.height = height;

      // Update state so React overlays match
      setActualColumnCount(columnCount);

      // Draw layers
      drawTemperatureBars(canvas, forecast.slice(0, columnCount), columnWidth);
      drawPrecipitation(canvas, forecast.slice(0, columnCount), columnWidth);
    };

    updateCanvas();

    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [forecast, sunTimes, height, minColumnWidth]);

  if (!forecast || forecast.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
      }}>
        No forecast data available
      </div>
    );
  }

  // Use the actual column count from canvas state
  const visibleForecast = forecast.slice(0, actualColumnCount);
  const columnWidth = 100 / actualColumnCount;

  // Create bar positioner for consistent positioning
  const barPositioner = createBarPositioner(visibleForecast, height);

  return (
    <div
      ref={containerRef}

    >
      {/* Canvas with overlays */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Day labels */}
        <div style={{
          display: 'flex',
          width: '100%',
        }}>
          {visibleForecast.map((day, index) => (
            <div
              key={index}
              style={{
                flex: `0 0 ${columnWidth}%`,
                textAlign: 'center',
                fontSize: '0.75em',
                fontWeight: '600',
				lineHeight: '1.2',
              }}
            >
              {formatDay(day.datetime)}
            </div>
          ))}
        </div>

        {/* Weather icons */}
        <div style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-around',
        }}>
          {visibleForecast.map((day, index) => {
            const icon = getWeatherIcon(day.condition);
            return (
              <div
                key={index}
                style={{
				  height: '1.25em',
                  flex: `0 0 ${columnWidth}%`,
                  display: 'flex',
                  justifyContent: 'center',
				  alignItems: 'center',
                }}
              >
                <ha-icon
                  icon={icon}
                  style={{
                    '--mdc-icon-size': '1em',
                    color: 'var(--primary-text-color, #fff)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Precipitation amounts */}
        <div style={{
          display: 'flex',
          width: '100%',
        }}>
          {visibleForecast.map((day, index) => {
            const precipText = formatPrecipitation(day.precipitation, precipitationUnit);
            return (
              <div
                key={index}
                style={{
                  flex: `0 0 ${columnWidth}%`,
                  textAlign: 'center',
                  fontSize: '0.625em',
                  minHeight: '0.625em',
                }}
              >
                {precipText}
              </div>
            );
          })}
        </div>

        {/* Canvas with temperature bars and precipitation */}
        <div style={{ position: 'relative', width: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: `${height}px`,
              borderRadius: '8px',
              display: 'block',
            }}
          />

          {/* Temperature labels overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}>
            {visibleForecast.map((day, index) => {
              const highTemp = day.temperature ?? 0;
              const lowTemp = day.templow ?? 0;
              const xPercent = (index + 0.5) * columnWidth;
              
              // Calculate bar positions using shared positioner
              const barTop = barPositioner.getTempY(highTemp);
              const barBottom = barPositioner.getTempY(lowTemp);

              return (
                <div key={index}>
                  {/* High temp - sits atop the bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${barTop}px`,
                      transform: 'translate(-50%, -100%)',
                      fontSize: '0.75em',
                      fontWeight: '600',
                      textShadow: '0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6))',
                      paddingBottom: '0.125em',
                    }}
                  >
                    {Math.round(highTemp)}°
                  </div>

                  {/* Low temp - sits below the bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${barBottom}px`,
                      transform: 'translateX(-50%)',
                      fontSize: '0.75em',
                      fontWeight: '600',
                      textShadow: '0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6))',
                      paddingTop: '0.125em',
                    }}
                  >
                    {Math.round(lowTemp)}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
