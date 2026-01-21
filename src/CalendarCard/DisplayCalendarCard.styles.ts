import { css } from '../shared/styleRegistry';

export const cardStyles = css`
:host {
  display: block;
}

.calendar-card {
  background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
  border-radius: var(--ha-card-border-radius, 12px);
  padding: 0 1em 0.5em;
  color: var(--primary-text-color, #fff);
  font-family: system-ui, -apple-system, sans-serif;
  position: relative;
}

.calendar-card.size-small {
  font-size: 14px;
}

.calendar-card.size-medium {
  font-size: 17.5px;
}

.calendar-card.size-large {
  font-size: 21px;
}

.calendar-divider {
  border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.calendar-loading {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-text-color, #888);
}

.calendar-refreshing {
  position: absolute;
  inset: 0.25em 0 0;
  font-size: 0.5em;
  opacity: 0.75;
  color: var(--secondary-text-color, #888);
  text-align: center;
  padding-bottom: 0.5em;
}
`;
