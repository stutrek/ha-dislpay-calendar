import { useMemo } from 'preact/hooks';
import { useCalendar } from './CalendarContext';
import './MonthGrid.styles'; // registers styles

// Get localized day abbreviations starting from Sunday
function getDayAbbreviations(): string[] {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  // Jan 4, 2026 is a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2026, 0, 4 + i);
    return formatter.format(date);
  });
}

// Get localized month name (long or short)
function getMonthName(date: Date, short = false): string {
  return new Intl.DateTimeFormat(undefined, { 
    day: "numeric",
    year: "numeric",
    month: short ? 'short' : 'long'
  }).format(date);
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthGrid() {
  const {
    currentMonth,
    selectedDay,
    today,
    nextMonth,
    prevMonth,
    goToToday,
    selectDay,
    getColorsForDay,
  } = useCalendar();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Check if we're viewing today (selected day is today AND month view contains today)
  const isViewingToday = isSameDay(selectedDay, today) && 
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  // Get localized day abbreviations (memoized)
  const dayAbbreviations = useMemo(() => getDayAbbreviations(), []);
  // Use short month name when showing Today button, full name otherwise
  const monthName = useMemo(
    () => getMonthName(selectedDay, !isViewingToday), 
    [selectedDay, isViewingToday]
  );

  // Build grid of day cells (6 weeks × 7 days)
  const cells = useMemo<DayCell[]>(() => {
    const result: DayCell[] = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month's leading days (fill to complete the final week only)
    const remaining = (7 - (result.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      result.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return result;
  }, [year, month]);

  return (
    <div class="month-grid">
      <div class="month-header">
        <button class="month-nav" onClick={prevMonth} aria-label="Previous month">
          ‹
        </button>
        <span class="month-title">
          {monthName}
        </span>
        {!isViewingToday && (
          <button class="today-btn" onClick={goToToday} aria-label="Go to today">
            Today
          </button>
        )}

        <button class="month-nav" onClick={nextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div class="weekday-header">
        {dayAbbreviations.map((day, i) => (
          <div key={i} class="weekday">
            {day}
          </div>
        ))}
      </div>

      <div class="days-grid">
        {cells.map((cell, index) => {
          const isSelected = isSameDay(cell.date, selectedDay);
          const isToday = isSameDay(cell.date, today);
          const colors = getColorsForDay(cell.date);

          const classNames = [
            'day-cell',
            cell.isCurrentMonth ? '' : 'other-month',
            isSelected ? 'selected' : '',
            isToday ? 'today' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={index}
              class={classNames}
              onClick={() => selectDay(cell.date)}
              aria-label={cell.date.toDateString()}
              aria-pressed={isSelected}
            >
              <span class="day-number">{cell.date.getDate()}</span>
              {colors.length > 0 && (
                <div class="event-dots">
                  {colors.slice(0, 4).map((color, i) => (
                    <span
                      key={i}
                      class="event-dot"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
