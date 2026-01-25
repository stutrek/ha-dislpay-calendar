import { render } from 'preact';
import { HAProvider, type HomeAssistant } from '../shared/HAContext';
import { WeatherProvider, type WeatherConfig } from './WeatherContext';
import { WeatherDisplay } from './WeatherDisplay';
import { getAllStyles } from '../shared/styleRegistry';
import { BaseHACard } from '../shared/BaseHACard';
import './WeatherCard.styles'; // registers card styles
import './DisplayWeatherEditor'; // registers editor element

// ============================================================================
// Types
// ============================================================================

interface CardConfig extends WeatherConfig {
  // Additional card config beyond WeatherConfig
}

// ============================================================================
// Preact Component for Shadow DOM
// ============================================================================

interface WeatherCardContentProps {
  config: WeatherConfig;
  hass: HomeAssistant;
  subscribeToEntity: (entityId: string, callback: (entity: any) => void) => () => void;
}

function WeatherCardContent({ config, hass, subscribeToEntity }: WeatherCardContentProps) {
  console.log('[WeatherCardContent] RENDER', { config, statesCount: Object.keys(hass.states).length });
  const sizeClass = `size-${config.size ?? 'medium'}`;
  
  return (
    <>
      <style>{getAllStyles()}</style>
      <div class={`weather-card ${sizeClass}`}>
        <HAProvider hass={hass} subscribeToEntity={subscribeToEntity}>
          <WeatherProvider config={config}>
            <WeatherDisplay />
          </WeatherProvider>
        </HAProvider>
      </div>
    </>
  );
}

// ============================================================================
// Web Component
// ============================================================================

class DisplayWeatherCard extends BaseHACard<CardConfig> {
  protected getCardName(): string {
    return 'DisplayWeatherCard';
  }

  protected _getEntityIds(): string[] {
    if (!this._config) return [];
    
    const entityIds: string[] = [this._config.entity];
    
    if (this._config.forecast_entity && this._config.forecast_entity !== this._config.entity) {
      entityIds.push(this._config.forecast_entity);
    }
    
    entityIds.push('sun.sun');

    return entityIds;
  }

  setConfig(config: CardConfig) {
    if (!config.entity) {
      throw new Error('Please define an entity (weather entity for current conditions)');
    }
    
    this._config = config;
    
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
      render(<div class="weather-loading">Loading...</div>, this._shadowRoot);
      return;
    }

    render(
      <WeatherCardContent config={this._config} hass={this._hass} subscribeToEntity={this._subscribeToEntity} />,
      this._shadowRoot
    );
  }

  static getStubConfig() {
    return {
      entity: '',
      size: 'medium',
    };
  }

  static getConfigElement() {
    return document.createElement('display-weather-editor');
  }
}

// ============================================================================
// Register
// ============================================================================

customElements.define('display-weather', DisplayWeatherCard);

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'display-weather',
  name: 'Display Weather',
  description: 'A weather card designed for wall-mounted displays',
});

console.info(
  '%c DISPLAY-WEATHER %c loaded ',
  'background: #f59e0b; color: white; font-weight: bold',
  ''
);

export { DisplayWeatherCard };
