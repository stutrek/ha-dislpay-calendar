/**
 * Type declarations for Home Assistant custom elements
 * These are available in the HA environment and mocked in Storybook
 */

import 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ha-icon': preact.JSX.HTMLAttributes<HTMLElement> & {
        icon?: string;
      };
      'ha-entity-picker': preact.JSX.HTMLAttributes<HTMLElement> & {
        hass?: unknown;
        value?: string;
        label?: string;
        'include-domains'?: string;
        'allow-custom-entity'?: boolean;
      };
      'ha-select': preact.JSX.HTMLAttributes<HTMLElement> & {
        label?: string;
        value?: string;
        naturalMenuWidth?: boolean;
        fixedMenuPosition?: boolean;
      };
      'ha-list-item': preact.JSX.HTMLAttributes<HTMLElement> & {
        value?: string;
      };
    }
  }
}
