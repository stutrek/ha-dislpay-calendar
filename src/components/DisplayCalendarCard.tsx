import { render } from 'preact';
import { HAProvider, type HomeAssistant } from '../HAContext';
import { CalendarProvider, useCalendar, type CalendarConfig } from './CalendarContext';
import { MonthGrid } from './MonthGrid';
import { EventList } from './EventList';
import { getAllStyles } from './styleRegistry';
import './DisplayCalendarCard.styles'; // registers card styles
// Import editor to ensure it's registered
import './DisplayCalendarEditor';

// ============================================================================
// Types
// ============================================================================

interface CardConfig extends CalendarConfig {
  // Additional card config beyond CalendarConfig
}

// ============================================================================
// Preact Component for Shadow DOM
// ============================================================================

interface CalendarCardContentProps {
  config: CalendarConfig;
  hass: HomeAssistant;
}

export function CalendarCardInner() {
  const { loading, refreshing } = useCalendar();
  
  if (loading) {
    return <div class="calendar-loading">Loading...</div>;
  }
  
  return (
    <>
      {refreshing && !loading && (
        <div class="calendar-refreshing">Checking for updates...</div>
      )}
      <MonthGrid />
      <div class="calendar-divider">
        <EventList />
      </div>
    </>
  );
}

function CalendarCardContent({ config, hass }: CalendarCardContentProps) {
  const sizeClass = `size-${config.fontSize || 'small'}`;
  return (
    <>
      <style>{getAllStyles()}</style>
      <div class={`calendar-card ${sizeClass}`}>
        <HAProvider hass={hass}>
          <CalendarProvider config={config}>
            <CalendarCardInner />
          </CalendarProvider>
        </HAProvider>
      </div>
    </>
  );
}

// ============================================================================
// Web Component
// ============================================================================

class DisplayCalendarCard extends HTMLElement {
  private _hass?: HomeAssistant;
  private _config?: CardConfig;
  private _shadowRoot: ShadowRoot;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  setConfig(config: CardConfig) {
    // Allow empty calendars for editor to work - we'll show a message
    this._config = {
      ...config,
      calendars: config.calendars ?? [],
    };
    this._render();
  }

  private _render() {
    if (!this._config) {
      render(<div>No config</div>, this._shadowRoot);
      return;
    }

    if (!this._hass) {
      render(<div class="calendar-loading">Loading...</div>, this._shadowRoot);
      return;
    }

    // Show message if no calendars configured
    if (this._config.calendars.length === 0) {
      const sizeClass = `size-${this._config.fontSize || 'small'}`;
      render(
        <>
          <style>{getAllStyles()}</style>
          <div class={`calendar-card ${sizeClass}`}>
            <div class="calendar-loading">Add a calendar to get started</div>
          </div>
        </>,
        this._shadowRoot
      );
      return;
    }

    render(
      <CalendarCardContent config={this._config} hass={this._hass} />,
      this._shadowRoot
    );
  }

  // Required for card picker - returns the visual config editor
  static getConfigElement() {
    return document.createElement('display-calendar-editor');
  }

  static getStubConfig() {
    // Return empty config - user will add calendars via the editor
    return {
      calendars: [],
    };
  }
}

// ============================================================================
// Register
// ============================================================================

customElements.define('display-calendar', DisplayCalendarCard);

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'display-calendar',
  name: 'Display Calendar',
  description: 'A calendar card with multi-calendar support and weather',
});

console.info(
  '%c DISPLAY-CALENDAR %c loaded ',
  'background: #3b82f6; color: white; font-weight: bold',
  ''
);

export { DisplayCalendarCard };
