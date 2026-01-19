import { css } from './styleRegistry';

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
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.month-title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.month-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-text-color, #fff);
}

.today-btn {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  background: none;
  border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.3));
  border-radius: 4px;
  color: var(--secondary-text-color, #aaa);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
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
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.75rem;
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
  margin-bottom: 0.25rem;
}

.weekday {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-text-color, #aaa);
  padding: 0.25rem;
}

/* Days grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  line-height: 2;
  height: 1.75rem;
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
  padding: 0.5rem;
  margin: -0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.selected {
  background-color: var(--primary-color, #03a9f4);
  color: var(--text-primary-color, #fff);
}

.day-cell.selected.today .day-number {
  background-color: transparent;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
}

/* Event dots */
.event-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  position: absolute;
  bottom: 2px;
}

.event-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
`;
