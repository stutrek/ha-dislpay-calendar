import { css } from '../shared/styleRegistry';

export const monthGridStyles = css`
.month-grid {
  font-family: system-ui, -apple-system, sans-serif;
  width: 100%;
}

/* Header with month/year and navigation */
.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin-bottom: 0em;
}

.month-title {
  font-size: 1.25em;
  color: var(--primary-text-color, #fff);
}

.today-btn {
  font: inherit;
  font-size: 1em;
  margin-left: 0.5em;
  padding: 0.25em 0.75em;
  background: none;
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.3));
  border-radius: 4px;
  color: var(--secondary-text-color, #aaa);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  vertical-align: middle;
}

.today-btn:hover {
  background-color: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
  color: var(--primary-text-color, #fff);
}

.today-btn:focus {
  outline: 2px solid var(--primary-color, #03a9f4);
  outline-offset: 2px;
}

.month-nav {
  font: inherit;
  font-size: 1.5em;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25em;
  color: var(--primary-text-color, #fff);
  border-radius: 4px;
  transition: background-color 0.15s;
}

.month-nav:hover {
  background-color: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
}

.month-nav:focus {
  outline: 2px solid var(--primary-color, #03a9f4);
  outline-offset: 2px;
}

/* Weekday header row */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 0.25em;
}

.weekday {
  font-size: 0.75em;
  font-weight: 500;
  color: var(--secondary-text-color, #aaa);
  padding: 0.25em;
}

/* Days grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 1em;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font: inherit;
  line-height: 2;
  height: 1.75em;
  cursor: pointer;
  border-radius: 4px;
  color: var(--primary-text-color, #fff);
  transition: background-color 0.15s;
  position: relative;
}

.day-cell:hover {
  background-color: var(--secondary-background-color, rgba(255, 255, 255, 0.1));
}

.day-cell:focus {
  outline: 2px solid var(--primary-color, #03a9f4);
  outline-offset: -2px;
}

.day-cell.other-month {
  color: var(--disabled-text-color, #666);
}

.day-cell.today .day-number {
  background-color: var(--primary-color, #03a9f4);
  color: var(--text-primary-color, #fff);
  border-radius: 50%;
  padding: 0.3em;
  margin: -0.3em;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1/1;
}

.day-cell.selected {
  background-color: var(--primary-color, #03a9f4);
  color: var(--text-primary-color, #fff);
}

.day-cell.selected.today .day-number {
  background-color: transparent;
}

.day-number {
  font-size: 0.875em;
  font-weight: 500;
  line-height: 1;
}

/* Event dots */
.event-dots {
  display: flex;
  gap: 0.125em;
  margin-top: 0.125em;
  position: absolute;
  bottom: 0.125em;
}

.event-dot {
  width: 0.25em;
  height: 0.25em;
  border-radius: 50%;
}
`;
