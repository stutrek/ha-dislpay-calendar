import { css } from './styleRegistry';

export const eventListStyles = css`
.event-list {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 0.25rem;
}

.event-list-empty {
  color: var(--secondary-text-color, #888);
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
}

.event-item {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0.125rem 0;
  min-height: 1.5rem;
}

/* Color bars on left edge - full height of event */
.event-colors {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.event-color-bar {
  flex: 1;
  width: 100%;
  min-height: 0;
}

/* Event content */
.event-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
}

.event-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--secondary-text-color, #aaa);
  font-variant-numeric: tabular-nums;
}

.event-summary {
  font-size: 0.875rem;
  color: var(--primary-text-color, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Weather display */
.event-weather {
  display: flex;
  align-items: center;
  align-self: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: var(--secondary-text-color, #aaa);
}

.weather-icon {
  font-size: 1rem;
}

.weather-temp {
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Divider between timed and all-day events */
.event-divider {
  height: 1px;
  background-color: var(--divider-color, rgba(255, 255, 255, 0.2));
  margin: 0.5rem 0;
}
`;
