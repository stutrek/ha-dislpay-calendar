import { css } from './styleRegistry';

export const eventListStyles = css`
.event-list {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 0.25em;
}

.event-list-empty {
  color: var(--secondary-text-color, #888);
  text-align: center;
  padding: 1em;
  font-size: 0.875em;
}

.event-item {
  display: flex;
  align-items: stretch;
  gap: 0.25em;
  padding: 0.125em 0;
  min-height: 1.5em;
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
}

.event-time {
  font-size: 0.75em;
  line-height: 1;
  font-weight: 600;
  color: var(--secondary-text-color, #aaa);
  font-variant-numeric: tabular-nums;
}

.event-summary {
  font-size: 0.875em;
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
  gap: 0.25em;
  flex-shrink: 0;
  color: var(--secondary-text-color, #aaa);
}

.weather-icon {
  font-size: 1em;
}

.weather-temp {
  font-size: 0.75em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Divider between timed and all-day events */
.event-divider {
  height: 1px;
  background-color: var(--divider-color, rgba(255, 255, 255, 0.2));
  margin: 0.5em 0;
}
`;
