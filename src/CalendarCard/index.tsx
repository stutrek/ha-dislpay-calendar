import { render } from 'preact';
import { HAProvider, type HomeAssistant } from '../shared/HAContext';
import { CalendarProvider, useCalendar, type CalendarConfig } from './CalendarContext';
import { MonthGrid } from './MonthGrid';
import { EventList } from './EventList';
import { getAllStyles } from '../shared/styleRegistry';
import { BaseHACard } from '../shared/BaseHACard';
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
  subscribeToEntity: (entityId: string, callback: (entity: any) => void) => () => void;
}

export function CalendarCardInner() {
  console.log('[CalendarCardInner] RENDER');
  const { loading, refreshing } = useCalendar();
  
  return (
    <>
      {refreshing && !loading && (
        <div class="calendar-refreshing">Checking for updates...</div>
      )}
      <MonthGrid />
      <div class="calendar-divider">
        {loading ? (
          <div class="calendar-loading">Loading...</div>
        ) : (
          <EventList />
        )}
      </div>
    </>
  );
}

function CalendarCardContent({ config, hass, subscribeToEntity }: CalendarCardContentProps) {
  console.log('[CalendarCardContent] RENDER', { config, statesCount: Object.keys(hass.states).length });
  const sizeClass = `size-${config.fontSize || 'small'}`;
  return (
    <>
      <style>{getAllStyles()}</style>
      <div class={`calendar-card ${sizeClass}`}>
        <HAProvider hass={hass} subscribeToEntity={subscribeToEntity}>
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

class DisplayCalendarCard extends BaseHACard<CardConfig> {
  protected getCardName(): string {
    return 'DisplayCalendarCard';
  }

  protected _getEntityIds(): string[] {
    if (!this._config) return [];
    
    const entityIds: string[] = [
      ...this._config.calendars.map(c => c.entityId),
    ];
    
    if (this._config.weatherEntity) {
      entityIds.push(this._config.weatherEntity);
    }

    return entityIds;
  }

  setConfig(config: CardConfig) {
    // Allow empty calendars for editor to work - we'll show a message
    this._config = {
      ...config,
      calendars: config.calendars ?? [],
    };
    
    if (this._hass) {
      this._subscribe();
    }
  }

  protected _render() {
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
      <CalendarCardContent config={this._config} hass={this._hass} subscribeToEntity={this._subscribeToEntity} />,
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
