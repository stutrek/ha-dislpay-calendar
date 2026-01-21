import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { DEFAULT_COLORS, type CalendarConfig, type CalendarConfigItem, type FontSize } from './CalendarContext';
import type { HomeAssistant } from '../shared/HAContext';
import { useCallbackStable } from '../shared/useCallbackStable';

// Type declarations for HA elements are in ../ha-elements.d.ts

// ============================================================================
// Types
// ============================================================================

interface EditorProps {
  hass: HomeAssistant;
  config: CalendarConfig;
  onConfigChanged: (config: CalendarConfig) => void;
}

// ============================================================================
// Editor Component
// ============================================================================

function CalendarEditorContent({ hass, config, onConfigChanged }: EditorProps) {
  const [calendars, setCalendars] = useState<CalendarConfigItem[]>(config.calendars ?? []);
  const [weatherEntity, setWeatherEntity] = useState<string>(config.weatherEntity ?? '');
  const [fontSize, setFontSize] = useState<FontSize>(config.fontSize ?? 'small');

  // Get available entities from hass
  const calendarEntities = Object.keys(hass.states).filter(e => e.startsWith('calendar.'));
  const weatherEntities = Object.keys(hass.states).filter(e => e.startsWith('weather.'));

  // Sync with external config changes
  useEffect(() => {
    setCalendars(config.calendars ?? []);
    setWeatherEntity(config.weatherEntity ?? '');
    setFontSize(config.fontSize ?? 'small');
  }, [config]);

  const fireConfigChanged = useCallbackStable((
    newCalendars: CalendarConfigItem[], 
    newWeather: string,
    newFontSize: FontSize
  ) => {
    // Only include calendars with valid entity IDs in the saved config
    const validCalendars = newCalendars.filter(cal => cal.entityId && cal.entityId.startsWith('calendar.'));
    const newConfig = {
      ...config,  // Preserve type and other fields
      calendars: validCalendars,
      ...(newWeather && newWeather.startsWith('weather.') 
        ? { weatherEntity: newWeather as `weather.${string}` } 
        : { weatherEntity: undefined }),
      fontSize: newFontSize,
    };
    onConfigChanged(newConfig);
  });

  const addCalendar = useCallbackStable(() => {
    const newCalendars = [
      ...calendars,
      { 
        entityId: '' as `calendar.${string}`,
        color: DEFAULT_COLORS[calendars.length % DEFAULT_COLORS.length],
      },
    ];
    setCalendars(newCalendars);
    // Don't fire config changed yet - wait until they select an entity
  });

  const removeCalendar = useCallbackStable((index: number) => {
    const newCalendars = calendars.filter((_, i) => i !== index);
    setCalendars(newCalendars);
    fireConfigChanged(newCalendars, weatherEntity, fontSize);
  });

  const updateCalendarEntity = useCallbackStable((index: number, entityId: string) => {
    const newCalendars = calendars.map((cal, i) => 
      i === index ? { ...cal, entityId: entityId as `calendar.${string}` } : cal
    );
    setCalendars(newCalendars);
    fireConfigChanged(newCalendars, weatherEntity, fontSize);
  });

  const updateCalendarColor = useCallbackStable((index: number, color: string) => {
    const newCalendars = calendars.map((cal, i) => 
      i === index ? { ...cal, color } : cal
    );
    setCalendars(newCalendars);
    fireConfigChanged(newCalendars, weatherEntity, fontSize);
  });

  const updateWeatherEntity = useCallbackStable((entityId: string) => {
    setWeatherEntity(entityId);
    fireConfigChanged(calendars, entityId, fontSize);
  });

  const updateFontSize = useCallbackStable((newFontSize: FontSize) => {
    setFontSize(newFontSize);
    fireConfigChanged(calendars, weatherEntity, newFontSize);
  });

  const handleFontSizeSelect = useCallbackStable((e: Event) => {
    const target = e.target as HTMLSelectElement;
    updateFontSize(target.value as FontSize);
  });

  const handleCalendarSelect = useCallbackStable((index: number, e: Event) => {
    const target = e.target as HTMLSelectElement;
    updateCalendarEntity(index, target.value);
  });

  const handleWeatherSelect = useCallbackStable((e: Event) => {
    const target = e.target as HTMLSelectElement;
    updateWeatherEntity(target.value);
  });

  return (
    <div class="editor">
      <style>{editorStyles}</style>
      
      <div class="section">
        <div class="section-header">
          <span>Calendars</span>
          <button class="add-btn" onClick={addCalendar}>+ Add Calendar</button>
        </div>
        
        {calendars.map((cal, index) => (
          <div class="calendar-row" key={index}>
            <ha-select
              label="Calendar"
              value={cal.entityId}
              naturalMenuWidth
              fixedMenuPosition
              onChange={(e: Event) => handleCalendarSelect(index, e)}
              // @ts-expect-error - HA event
              onclosed={(e: Event) => e.stopPropagation()}
            >
              <ha-list-item value="">Select calendar...</ha-list-item>
              {calendarEntities.map(entity => (
                <ha-list-item key={entity} value={entity}>
                  {hass.states[entity]?.attributes?.friendly_name ?? entity}
                </ha-list-item>
              ))}
            </ha-select>
            <input
              type="color"
              class="color-picker"
              value={cal.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              onChange={(e) => updateCalendarColor(index, (e.target as HTMLInputElement).value)}
            />
            <button class="remove-btn" onClick={() => removeCalendar(index)}>×</button>
          </div>
        ))}
        
        {calendars.length === 0 && (
          <div class="empty-message">No calendars added. Click "Add Calendar" to get started.</div>
        )}
      </div>
      
      <div class="section">
        <div class="section-header">
          <span>Weather (optional)</span>
        </div>
        <ha-select
          label="Weather Entity"
          value={weatherEntity}
          naturalMenuWidth
          fixedMenuPosition
          onChange={handleWeatherSelect}
          // @ts-expect-error - HA event
          onclosed={(e: Event) => e.stopPropagation()}
        >
          <ha-list-item value="">None</ha-list-item>
          {weatherEntities.map(entity => (
            <ha-list-item key={entity} value={entity}>
              {hass.states[entity]?.attributes?.friendly_name ?? entity}
            </ha-list-item>
          ))}
        </ha-select>
      </div>

      <div class="section">
        <div class="section-header">
          <span>Appearance</span>
        </div>
        <ha-select
          label="Font Size"
          value={fontSize}
          naturalMenuWidth
          fixedMenuPosition
          onChange={handleFontSizeSelect}
          // @ts-expect-error - HA event
          onclosed={(e: Event) => e.stopPropagation()}
        >
          <ha-list-item value="small">Small</ha-list-item>
          <ha-list-item value="medium">Medium</ha-list-item>
          <ha-list-item value="large">Large</ha-list-item>
        </ha-select>
      </div>
    </div>
  );
}

const editorStyles = `
  .editor {
    padding: 16px;
  }
  
  .section {
    margin-bottom: 24px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  
  .add-btn {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .add-btn:hover {
    opacity: 0.9;
  }
  
  .calendar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .calendar-row ha-select {
    flex: 1;
  }
  
  .color-picker {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: none;
  }
  
  .color-picker::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  
  .color-picker::-webkit-color-swatch {
    border-radius: 4px;
    border: 1px solid var(--divider-color);
  }
  
  .remove-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 4px;
    background: var(--error-color, #db4437);
    color: white;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-btn:hover {
    opacity: 0.9;
  }
  
  .empty-message {
    color: var(--secondary-text-color);
    font-size: 14px;
    padding: 12px;
    text-align: center;
    border: 1px dashed var(--divider-color);
    border-radius: 4px;
  }
  
  ha-select {
    display: block;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .input-row label {
    color: var(--primary-text-color);
    font-size: 14px;
    min-width: 80px;
  }

  .text-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 14px;
  }

  .text-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .text-input::placeholder {
    color: var(--secondary-text-color);
  }
`;

// ============================================================================
// Custom Element
// ============================================================================

class DisplayCalendarEditor extends HTMLElement {
  private _hass?: HomeAssistant;
  private _config?: CalendarConfig;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  setConfig(config: CalendarConfig) {
    this._config = config;
    this._render();
  }

  private _fireConfigChanged = (config: CalendarConfig) => {
    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  };

  private _render() {
    if (!this._hass || !this._config) {
      return;
    }

    // Render to light DOM so HA components work properly
    render(
      <CalendarEditorContent
        hass={this._hass}
        config={this._config}
        onConfigChanged={this._fireConfigChanged}
      />,
      this
    );
  }
}

// ============================================================================
// Register
// ============================================================================

customElements.define('display-calendar-editor', DisplayCalendarEditor);

export { DisplayCalendarEditor };
