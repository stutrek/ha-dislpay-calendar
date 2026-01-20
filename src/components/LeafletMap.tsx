import { useRef, useEffect } from 'preact/hooks';
import L from 'leaflet';
import leafletCss from 'leaflet/dist/leaflet.css?inline';
import { registerRawStyles, css } from './styleRegistry';

// Import marker icons to fix bundling issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon paths for bundled environments
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Register Leaflet's CSS for Shadow DOM
registerRawStyles(leafletCss);

// Register our custom marker styles
css`
.leaflet-map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* the calendar is way too dark in dark mode, so we need to brighten it up */
.leaflet-map-container.dark .leaflet-tile-pane {
  filter: brightness(2.75);
}

/* Custom home marker styling */
.home-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  background: var(--primary-color, #3b82f6);
  color: white;
}

.home-marker ha-icon {
  --mdc-icon-size: 16px;
}

/* Hide default Leaflet attribution styling, we add our own */
.leaflet-control-attribution {
  display: none;
}

/* Ensure tiles don't have gaps */
.leaflet-tile-container img {
  width: 256.5px !important;
  height: 256.5px !important;
}
`;

// ============================================================================
// Types
// ============================================================================

interface LeafletMapProps {
  eventLat: number;
  eventLng: number;
  homeLat?: number;
  homeLng?: number;
  isDarkMode?: boolean;
}

// ============================================================================
// Tile Layer URLs
// ============================================================================

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};

// ============================================================================
// Component
// ============================================================================

export function LeafletMap({ eventLat, eventLng, homeLat, homeLng, isDarkMode = false }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    // Create map with minimal controls
    const map = L.map(container, {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    });
    
    mapRef.current = map;
    
    // Add tile layer based on theme
    const tileUrl = isDarkMode ? TILE_URLS.dark : TILE_URLS.light;
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, © CARTO',
    }).addTo(map);
    
    // Home marker using custom divIcon with ha-icon
    const homeIcon = L.divIcon({
      className: 'home-marker',
      html: '<ha-icon icon="mdi:home"></ha-icon>',
      iconSize: [24, 24],
      iconAnchor: [12, 12], // Center
    });
    
    // Add event marker (using Leaflet's default blue pin)
    L.marker([eventLat, eventLng]).addTo(map);
    
    // Add home marker if available
    if (homeLat !== undefined && homeLng !== undefined) {
      L.marker([homeLat, homeLng], { icon: homeIcon }).addTo(map);
    }
    
    // Fit bounds to show all markers
    const bounds = L.latLngBounds([[eventLat, eventLng]]);
    if (homeLat !== undefined && homeLng !== undefined) {
      bounds.extend([homeLat, homeLng]);
    }
    
    // Add padding and fit
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 20,
    });
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [eventLat, eventLng, homeLat, homeLng, isDarkMode]);
  
  return <div ref={containerRef} class={`leaflet-map-container ${isDarkMode ? 'dark' : ''}`} />;
}
