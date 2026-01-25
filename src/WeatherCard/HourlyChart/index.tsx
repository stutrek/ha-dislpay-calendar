// ============================================================================
// Weather Card 2 - New Hourly Weather Card
// A simplified hourly weather display component
// ============================================================================

import type { JSX } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import type { WeatherForecast, SunTimes } from '../WeatherContext';
import { drawHourlyBackground, drawTemperatureLine, createTemperaturePositioner, getWeatherIcon } from './canvasHelpers';
import { drawPrecipitation } from './precipitation';

// ============================================================================
// Types
// ============================================================================

export interface HourlyChartProps {
  forecast: WeatherForecast[];
  sunTimes: SunTimes;
  height?: number;
  pixelsPerDegree?: number;
  maxItems?: number;
}

// ============================================================================
// Component
// ============================================================================

export function HourlyChart({ 
  forecast: inputForecast, 
  sunTimes,
  height = 120,
  pixelsPerDegree = 3,
  maxItems = 12
}: HourlyChartProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const forecast = inputForecast.slice(0, maxItems);

  // Draw canvas when forecast or sunTimes change
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !forecast || forecast.length === 0) return;

    // Set canvas size to match container
    const updateCanvas = () => {
      const containerWidth = container.offsetWidth;
      canvas.width = containerWidth;
      canvas.height = height;
      
      // Draw layers in order
      drawHourlyBackground(canvas, forecast, sunTimes);
      drawTemperatureLine(canvas, forecast, pixelsPerDegree);
      drawPrecipitation(canvas, forecast); // Drawn last so particles appear on top
    };

    updateCanvas();

    // Handle resize
    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [forecast, sunTimes, height, pixelsPerDegree]);

  if (!forecast || forecast.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#888',
      }}>
        No forecast data available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
    >
      {/* Canvas with absolutely positioned labels */}
      <div style={{
        position: 'relative',
        width: '100%',
      }}>
        {/* Weather icons row above canvas */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '1.25em',
          marginBottom: '0.125em',
        }}>
          {(() => {
            // Get container width, use a default if not available yet
            const container = containerRef.current;
            const containerWidth = container?.offsetWidth || 400;
            
            // Group consecutive hours with the same condition
            const groups: Array<{ startIndex: number; endIndex: number; condition: string | undefined }> = [];
            let currentGroup: { startIndex: number; endIndex: number; condition: string | undefined } | null = null;
            
            forecast.forEach((hour, index) => {
              // Skip first and last
              if (index === 0 || index === forecast.length - 1) return;
              
              if (!currentGroup || currentGroup.condition !== hour.condition) {
                // Start new group
                if (currentGroup) {
                  groups.push(currentGroup);
                }
                currentGroup = {
                  startIndex: index,
                  endIndex: index,
                  condition: hour.condition,
                };
              } else {
                // Extend current group
                currentGroup.endIndex = index;
              }
            });
            
            // Push the last group
            if (currentGroup) {
              groups.push(currentGroup);
            }
            
            // Find the smallest group width in pixels
            const smallestGroupWidth = Math.min(...groups.map(group => {
              const startX = (group.startIndex / (forecast.length - 1));
              const endX = (group.endIndex / (forecast.length - 1)) + 1;
              return (endX - startX) * (containerWidth / forecast.length);
            }));
            
            // Calculate icon size based on smallest group (max 1.125em)
            // Assume icons need ~24px at 1em font size, scale accordingly
            const maxSize = 1.125;
            const minSize = 0.5;
            const iconSize = Math.max(minSize, Math.min(maxSize, smallestGroupWidth / 24));
            
            // Render consolidated icons with lines
            return groups.map((group, groupIndex) => {
              const icon = getWeatherIcon(group.condition);
              
              // Calculate positions
              const startX = (group.startIndex / (forecast.length - 1)) * 100;
              const endX = (group.endIndex / (forecast.length - 1)) * 100;
              const centerX = (startX + endX) / 2;
              
              // Only show line if group has multiple hours
              const showLine = group.startIndex !== group.endIndex;
              // Only show end tick if not the last group (and has multiple hours)
              const showEndTick = groupIndex < groups.length - 1 && showLine;
              
              return (
                <div key={groupIndex}>
                  {/* Horizontal line underneath the icons - only for multi-hour conditions */}
                  {showLine && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${startX}%`,
                        right: `${100 - endX}%`,
                        bottom: 0,
                        height: '0.0625em',
                        backgroundColor: 'var(--primary-text-color, #fff)',
                        opacity: 0.3,
                      }}
                    />
                  )}
                  
                  {/* End tick mark - creates the gap between conditions */}
                  {showLine && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${startX}%`,
                        bottom: 0,
                        width: '0.0625em',
                        height: '0.375em',
                        backgroundColor: 'var(--primary-text-color, #fff)',
                        opacity: 0.3,
                      }}
                    />
                  )}
                  {showEndTick && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${endX}%`,
                        bottom: 0,
                        width: '0.0625em',
                        height: '0.375em',
                        backgroundColor: 'var(--primary-text-color, #fff)',
                        opacity: 0.3,
                      }}
                    />
                  )}
                  {/* Icon in the center */}
                  <ha-icon
                    icon={icon}
                    style={{
                      position: 'absolute',
                      left: `${centerX}%`,
                      transform: 'translateX(-50%)',
                      '--mdc-icon-size': `${iconSize}em`,
                      color: 'var(--primary-text-color, #fff)',
                    }}
                  />
                </div>
              );
            });
          })()}
        </div>
        
        {/* Canvas for visualization */}
        <div style={{ position: 'relative' }}>
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
            height: `${height}px`,
            pointerEvents: 'none',
          }}>
            {(() => {
              // Use shared temperature positioner
              const { getTempY } = createTemperaturePositioner(forecast, height, pixelsPerDegree);
              
              return forecast.map((hour, index) => {
                const date = new Date(hour.datetime);
                const hourNum = date.getHours();
                
                // Skip first hour and only show labels for every 3rd hour
                if (index === 0 || hourNum % 3 !== 0) return null;
                
                const temp = hour.temperature ?? 0;
                const xPercent = (index / (forecast.length - 1)) * 100;
                
                // Calculate exact Y position using shared utility
                const lineY = getTempY(temp);
                
                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${lineY}px`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '0.75em',
                      fontWeight: '600',
                      textShadow: '0 0 0.2em var(--card-background-color, rgba(255,255,255,0.8)), 0 0 0.4em var(--card-background-color, rgba(255,255,255,0.6))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Math.round(temp)}°
                  </div>
                );
              });
            })()}
          </div>
        </div>
        
        {/* Hour timeline below canvas */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '1.5em',
          marginTop: '0.0625em',
        }}>
          {forecast.map((hour, index) => {
            if (index === 0 || index === forecast.length - 1) return null;
            const date = new Date(hour.datetime);
            const hourNum = date.getHours();
            const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
            const xPercent = (index / (forecast.length - 1)) * 100;
            
            // Every 3rd hour shows number, others show tick mark
            if (hourNum % 3 === 0) {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${xPercent}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '0.75em',
                    fontWeight: '500',
                    color: 'var(--primary-text-color, #fff)',
                  }}
                >
                  {hour12}
                </div>
              );
            } else {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${xPercent}%`,
                    top: '0.3125em',
                    transform: 'translateX(-50%)',
                    width: '0.0625em',
                    height: '0.375em',
                    backgroundColor: 'var(--primary-text-color, #fff)',
                  }}
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
