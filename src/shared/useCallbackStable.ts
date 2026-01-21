import { useRef } from 'preact/hooks';

/**
 * Creates a stable callback reference that always calls the latest version of the callback.
 * Unlike useCallback, this never changes identity, so it won't cause re-renders in children.
 * 
 * @param callback The callback function to stabilize
 * @returns A stable function reference that always calls the latest callback
 */
export function useCallbackStable<T extends (...args: never[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);

  callbackRef.current = callback;

  // Create a stable function reference once
  const stableRef = useRef<T | null>(null);
  if (stableRef.current === null) {
    stableRef.current = ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T;
  }

  return stableRef.current;
}
