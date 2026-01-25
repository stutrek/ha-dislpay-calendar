import { css } from '../shared/styleRegistry';

export const weatherCardStyles = css`
:host {
  display: block;
}

.weather-card {
  background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
  border-radius: var(--ha-card-border-radius, 12px);
  padding: 0.5em 1em 0.5em;
  color: var(--primary-text-color, #fff);
  font-family: system-ui, -apple-system, sans-serif;
}

.weather-card.size-small {
  font-size: 14px;
}

.weather-card.size-medium {
  font-size: 17.5px;
}

.weather-card.size-large {
  font-size: 21px;
}

.weather-loading,
.weather-error {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-text-color, #888);
}

.weather-display hr {
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
  margin: 0.5em 0;
}

/* Header: temp + icon on left, time on right */
.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 1;
  margin-top: 0.25em;
}

.weather-main {
  display: flex;
  align-items: baseline;
  gap: 0.125em;
}

.weather-icon-large {
  --mdc-icon-size: 1.25em;
  color: var(--primary-color, #f59e0b);
  align-self: center;
}

.weather-temp-large {
  font-size: 1.25em;
}

.weather-feels-like {
  font-size: 0.625em;
  font-weight: 400;
  color: var(--secondary-text-color, #aaa);
  margin-left: 0.25em;
}

.weather-time {
  font-size: 1.25em;
  line-height: 1;
}

/* Conditions text */
.weather-condition {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  text-transform: capitalize;
}

/* Details row */
.weather-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 0.75em;
  gap: 1em;
}

/* Humidity / Dewpoint group */
.weather-detail-group {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.weather-detail-group ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.detail-value {
  font-size: 1em;
  font-weight: 500;
}

.detail-separator {
  color: var(--secondary-text-color, #aaa);
  margin: 0 0.125em;
}

/* Wind section */
.weather-detail-wind {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

.wind-main {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.wind-main ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, #aaa);
}

.wind-arrow {
  --mdc-icon-size: 1em;
  transition: transform 0.3s ease;
}

.wind-unit {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
}

.wind-gust {
  font-size: 0.875em;
  color: var(--secondary-text-color, #aaa);
}

/* Forecast sections - both horizontal, fill width */
.forecast-section {
  display: flex;
  flex-direction: column;
}

.forecast-row {
  display: flex;
  justify-content: space-between;
  gap: 0.25em;
  overflow: hidden;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125em;
  flex: 1 1 0;
  min-width: 0;
  padding: 0.375em 0.25em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.forecast-item-daily {
  /* Daily items can be slightly taller */
}

.forecast-time {
  font-size: 0.625em;
  color: var(--secondary-text-color, #aaa);
  white-space: nowrap;
}

.forecast-icon {
  --mdc-icon-size: 1.25em;
  color: var(--primary-color, #f59e0b);
}

.forecast-temp {
  font-size: 0.875em;
  font-weight: 500;
}

.forecast-temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.forecast-temp-low {
  font-size: 0.75em;
  color: var(--secondary-text-color, #aaa);
}

.forecast-precip {
  font-size: 0.625em;
  color: var(--info-color, #3b82f6);
}

/* Hourly Chart */
.hourly-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Daily Chart */
.daily-chart {
  border-radius: 8px;
  overflow: hidden;
  margin: 0.25em 0;
  font-size: inherit;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hourly-chart *,
  .daily-chart * {
    animation: none !important;
    transition: none !important;
  }
}
`;
