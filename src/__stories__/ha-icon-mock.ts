/**
 * Mock ha-icon component for Storybook
 * Uses @mdi/js to render actual MDI icons as SVGs
 */
import * as mdiIcons from '@mdi/js';

// Convert mdi:weather-sunny -> mdiWeatherSunny
function mdiNameToImport(icon: string): string {
  if (!icon.startsWith('mdi:')) return '';
  
  const name = icon.slice(4); // Remove 'mdi:'
  // Convert kebab-case to PascalCase and prepend 'mdi'
  const pascalCase = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  return 'mdi' + pascalCase;
}

class HaIconMock extends HTMLElement {
  private _icon: string = '';
  
  static get observedAttributes() {
    return ['icon'];
  }
  
  connectedCallback() {
    this.render();
  }
  
  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'icon') {
      this._icon = newValue;
      this.render();
    }
  }
  
  set icon(value: string) {
    this._icon = value;
    this.setAttribute('icon', value);
    this.render();
  }
  
  get icon() {
    return this._icon;
  }
  
  private render() {
    const iconName = mdiNameToImport(this._icon);
    const path = (mdiIcons as Record<string, string>)[iconName];
    
    if (path) {
      this.innerHTML = `
        <svg viewBox="0 0 24 24" style="width: 1em; height: 1em; fill: currentColor;">
          <path d="${path}" />
        </svg>
      `;
    } else {
      // Fallback for unknown icons
      this.innerHTML = `<span style="font-size: 1em;">❓</span>`;
    }
  }
}

// Only register if not already defined (avoid errors in HA)
if (typeof customElements !== 'undefined' && !customElements.get('ha-icon')) {
  customElements.define('ha-icon', HaIconMock);
}

export { HaIconMock };
