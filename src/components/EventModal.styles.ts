import { css } from './styleRegistry';

export const eventModalStyles = css`
/* Dialog element - centered card */
.event-modal {
  border: none;
  border-radius: var(--ha-card-border-radius, 12px);
  background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
  color: var(--primary-text-color, #fff);
  padding: 0;
  max-width: min(90vw, 800px);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Backdrop overlay */
.event-modal::backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

/* Modal content container */
.event-modal-content {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: auto;
}

/* Header with close button */
.event-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5em;
  padding: 1em 1em 0.5em;
  position: sticky;
  top: 0;
  background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
  z-index: 1;
}

.event-modal-title {
  margin: 0 1em 0 0;
  font-size: 1.125em;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.event-modal-close {
  background: none;
  border: none;
  padding: 0.25em;
  margin: -0.25em;
  cursor: pointer;
  color: var(--secondary-text-color, #888);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-modal-close:hover {
  color: var(--primary-text-color, #fff);
  background: rgba(255, 255, 255, 0.1);
}

.event-modal-close:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* Body content - two column layout */
.event-modal-body {
  padding: 0 1em 1em;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}

/* Left column: event details */
.event-modal-details {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

/* Calendar names */
.event-modal-calendars {
  font-size: 0.875em;
  color: var(--secondary-text-color, #888);
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.event-modal-calendars ha-icon {
  --mdc-icon-size: 1em;
}

/* Time display */
.event-modal-time {
  font-size: 0.875em;
  color: var(--secondary-text-color, #888);
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.event-modal-time ha-icon {
  --mdc-icon-size: 1em;
}

/* Location text */
.event-modal-location-text {
  font-size: 0.875em;
  color: var(--secondary-text-color, #888);
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

.event-modal-location-text ha-icon {
  --mdc-icon-size: 1em;
  flex-shrink: 0;
  margin-top: 0.1em;
}

.event-modal-location-address {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Description */
.event-modal-description {
  font-size: 0.875em;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--primary-text-color, #fff);
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

/* Right column: map */
.event-modal-map-column {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

/* Re-geocode button - positioned in top-right of map column */
.event-modal-regeocode {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  z-index: 1;
  background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
  border: none;
  padding: 0.25em;
  cursor: pointer;
  color: var(--secondary-text-color, #888);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.event-modal-regeocode:hover {
  opacity: 1;
  color: var(--primary-text-color, #fff);
  background: rgba(255, 255, 255, 0.2);
}

.event-modal-regeocode:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  opacity: 1;
}

.event-modal-regeocode ha-icon {
  --mdc-icon-size: 1em;
}

/* Map container */
.event-modal-map-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.event-modal-map {
  width: 100%;
  height: 100%;
  border: none;
}

/* Map loading state */
.event-modal-map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text-color, #888);
  font-size: 0.875em;
}

/* Map not found state */
.event-modal-map-not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--secondary-text-color, #888);
  font-size: 0.875em;
  text-align: center;
  padding: 1em;
}

/* Attribution */
.event-modal-attribution {
  font-size: 0.625em;
  color: var(--secondary-text-color, #888);
  text-align: right;
}

.event-modal-attribution a {
  color: inherit;
  text-decoration: underline;
}

/* Single column layout when no map */
.event-modal-body:not(:has(.event-modal-map-column)) {
  grid-template-columns: 1fr;
}
`;
