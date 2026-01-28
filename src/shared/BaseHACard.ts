import type { HomeAssistant } from './HAContext';

/**
 * Base class for Home Assistant cards with entity subscription management.
 * Handles fine-grained entity subscriptions and notifies Preact components.
 */
export abstract class BaseHACard<TConfig> extends HTMLElement {
  protected _hass?: HomeAssistant;
  protected _config?: TConfig;
  protected _shadowRoot: ShadowRoot;
  private _unsubscribe?: () => void;
  private _entityChangeListeners = new Map<string, Set<(entity: any) => void>>();
  private _subscribeId = 0; // Guard against overlapping subscribe calls

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  // Lifecycle methods
  connectedCallback() {
    console.log(`[${this.getCardName()}] Connected to DOM`);
    this._subscribe();
  }

  disconnectedCallback() {
    console.log(`[${this.getCardName()}] Disconnected from DOM`);
    this._unsubscribe?.();
    this._entityChangeListeners.clear();
  }

  // Hass setter
  set hass(hass: HomeAssistant) {
    const hadHass = !!this._hass;
    this._hass = hass;
    
    if (!hadHass && this._config) {
      this._subscribe();
    }
    // Don't call _render() here - let subscriptions trigger it
  }

  // Subscription management
  protected async _subscribe() {
    if (!this._hass || !this._config) return;

    // Increment ID to invalidate any in-flight subscribe calls
    const subscribeId = ++this._subscribeId;

    // Unsubscribe from previous subscription
    this._unsubscribe?.();
    this._unsubscribe = undefined;

    const entityIds = this._getEntityIds();

    if (entityIds.length === 0) {
      console.log(`[${this.getCardName()}] No entities to subscribe to`);
      this._render();
      return;
    }

    console.log(`[${this.getCardName()}] Subscribing to:`, entityIds);

    try {
      const unsubscribe = await this._hass.connection.subscribeMessage<{
        entity_id: string;
        new_state: any;
        old_state: any;
      }>(
        (msg) => {
          console.log(`[${this.getCardName()}] State changed:`, msg.entity_id);
          
          if (this._hass && msg.new_state) {
            this._hass.states[msg.entity_id] = msg.new_state;
          }
          
          this._notifyEntityChanges({ [msg.entity_id]: msg.new_state });
        },
        {
          type: 'subscribe_entities',
          entity_ids: entityIds,
        }
      );

      // Only use this subscription if it's still the latest
      if (subscribeId === this._subscribeId) {
        this._unsubscribe = unsubscribe;
        this._render();
      } else {
        // Stale subscription, clean it up
        unsubscribe();
      }
    } catch (err) {
      // Only handle error if this is still the latest subscribe call
      if (subscribeId === this._subscribeId) {
        console.error(`[${this.getCardName()}] Subscription failed:`, err);
        this._render();
      }
    }
  }

  private _notifyEntityChanges(entities: Record<string, any>) {
    for (const [entityId, entity] of Object.entries(entities)) {
      const listeners = this._entityChangeListeners.get(entityId);
      if (listeners) {
        console.log(`[${this.getCardName()}] Notifying ${listeners.size} listeners for ${entityId}`);
        listeners.forEach(listener => listener(entity));
      }
    }
  }

  protected _subscribeToEntity = (entityId: string, callback: (entity: any) => void) => {
    console.log(`[${this.getCardName()}] Component subscribing to ${entityId}`);
    
    if (!this._entityChangeListeners.has(entityId)) {
      this._entityChangeListeners.set(entityId, new Set());
    }
    this._entityChangeListeners.get(entityId)!.add(callback);

    return () => {
      console.log(`[${this.getCardName()}] Component unsubscribing from ${entityId}`);
      const listeners = this._entityChangeListeners.get(entityId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this._entityChangeListeners.delete(entityId);
        }
      }
    };
  };

  // Abstract methods that child classes must implement
  protected abstract getCardName(): string;
  protected abstract _getEntityIds(): string[];
  protected abstract _render(): void;
  abstract setConfig(config: TConfig): void;
}
