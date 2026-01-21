import { useState, useEffect, useRef } from 'preact/hooks';
import { useCallbackStable } from '../shared/useCallbackStable';

// ============================================================================
// Types
// ============================================================================

export interface GeocodeCacheEntry {
  lat: number;
  lng: number;
  notFound?: false;
}

export interface GeocodeNotFoundEntry {
  notFound: true;
}

type CacheEntry = GeocodeCacheEntry | GeocodeNotFoundEntry;

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_PREFIX = 'geocode_';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Counter for unique JSONP callback names
let jsonpCounter = 0;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize an address for better geocoding results.
 * - Replace newlines with commas
 * - Normalize fancy quotes to simple ones
 * - Collapse multiple spaces
 */
function normalizeAddress(address: string): string {
  return address
    .replace(/[\r\n]+/g, ', ')      // Replace newlines with commas
    .replace(/['']/g, "'")          // Normalize fancy single quotes
    .replace(/[""]/g, '"')          // Normalize fancy double quotes
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .replace(/,\s*,/g, ',')         // Remove double commas
    .trim();
}

/**
 * Strip the first part of an address (likely a business name).
 * Only returns a result if the remaining address looks like a street address
 * (first remaining part contains a number - works for US and European formats).
 * 
 * "Ms. J's Gymnastics, 71 India St, Brooklyn, NY" -> "71 India St, Brooklyn, NY" ✓
 * "Hot 2 Go, 123 Main St, City" -> "123 Main St, City" ✓
 * "Business, Brooklyn, NY 11222" -> null (would be too general)
 */
function stripFirstPart(address: string): string | null {
  const normalized = normalizeAddress(address);
  const parts = normalized.split(/,\s*/);
  
  if (parts.length > 1) {
    const remaining = parts.slice(1);
    const firstRemaining = remaining[0].trim();
    
    // Check if first remaining part looks like a street address (contains a number)
    // This filters out results like "Brooklyn, NY" where city is first
    if (/\d/.test(firstRemaining)) {
      return remaining.join(', ');
    }
  }
  
  return null; // Nothing useful to strip to
}

/**
 * Create a cache key from an address string.
 * Normalizes by lowercasing and removing extra whitespace.
 */
function getCacheKey(address: string): string {
  const normalized = normalizeAddress(address).toLowerCase();
  return CACHE_PREFIX + normalized;
}

/**
 * Get cached geocode result from localStorage.
 */
function getFromCache(address: string): CacheEntry | null {
  try {
    const key = getCacheKey(address);
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as CacheEntry;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Save geocode result to localStorage.
 */
function saveToCache(address: string, entry: CacheEntry): void {
  try {
    const key = getCacheKey(address);
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

/**
 * Remove a cached entry from localStorage.
 */
function removeFromCache(address: string): void {
  try {
    const key = getCacheKey(address);
    localStorage.removeItem(key);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Nominatim API result item
 */
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Make a single JSONP request to Nominatim.
 */
function nominatimJsonp(address: string): Promise<NominatimResult[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `__nominatim_callback_${++jsonpCounter}_${Date.now()}`;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Nominatim request timed out'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    };

    // Set up the callback function
    (window as unknown as Record<string, unknown>)[callbackName] = (data: NominatimResult[]) => {
      cleanup();
      resolve(data);
    };

    // Build URL with JSONP callback
    // Include email to identify app per Nominatim usage policy
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      json_callback: callbackName,
      email: 'display-calendar-card@users.noreply.github.com',
    });

    // Create and insert script element
    const script = document.createElement('script');
    script.src = `${NOMINATIM_URL}?${params}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Nominatim request failed'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Fetch geocode data using JSONP to avoid CORS issues.
 * Tries full address first, then falls back to street-only if not found.
 */
async function fetchWithJsonp(rawAddress: string): Promise<NominatimResult[]> {
  const fullAddress = normalizeAddress(rawAddress);
  
  // Try full address first
  const fullResult = await nominatimJsonp(fullAddress);
  if (fullResult.length > 0) {
    return fullResult;
  }
  
  // If not found, try stripping first part (likely business name)
  const withoutFirst = stripFirstPart(rawAddress);
  if (withoutFirst) {
    const strippedResult = await nominatimJsonp(withoutFirst);
    if (strippedResult.length > 0) {
      return strippedResult;
    }
  }
  
  // Nothing found
  return [];
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to geocode an address using Nominatim with localStorage caching.
 * 
 * @param address The address string to geocode, or null/undefined to skip
 * @returns Geocode result with lat/lng, loading state, notFound flag, and refetch function
 */
export function useGeocode(address: string | null | undefined): GeocodeResult {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Track current fetch to avoid race conditions
  const fetchIdRef = useRef(0);
  
  // Track if we should skip cache on next fetch (for refetch)
  const skipCacheRef = useRef(false);

  const fetchGeocode = useCallbackStable(async () => {
    if (!address) {
      setLat(null);
      setLng(null);
      setLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    // Check cache first (unless we're doing a forced refetch)
    if (!skipCacheRef.current) {
      const cached = getFromCache(address);
      if (cached) {
        if (cached.notFound) {
          setLat(null);
          setLng(null);
          setNotFound(true);
          setLoading(false);
          setError(null);
        } else {
          setLat(cached.lat);
          setLng(cached.lng);
          setNotFound(false);
          setLoading(false);
          setError(null);
        }
        return;
      }
    }
    
    // Reset skip cache flag
    skipCacheRef.current = false;

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Use JSONP to avoid CORS issues
      const data = await fetchWithJsonp(address);

      // Only update if this is still the latest fetch
      if (fetchId !== fetchIdRef.current) return;

      if (data.length === 0) {
        // Address not found
        saveToCache(address, { notFound: true });
        setLat(null);
        setLng(null);
        setNotFound(true);
        setLoading(false);
      } else {
        // Found coordinates
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        saveToCache(address, { lat: newLat, lng: newLng });
        setLat(newLat);
        setLng(newLng);
        setNotFound(false);
        setLoading(false);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  });

  // Fetch when address changes
  useEffect(() => {
    fetchGeocode();
  }, [address, fetchGeocode]);

  // Refetch function that clears cache first
  const refetch = useCallbackStable(() => {
    if (address) {
      removeFromCache(address);
      skipCacheRef.current = true;
      fetchGeocode();
    }
  });

  return { lat, lng, loading, notFound, error, refetch };
}
