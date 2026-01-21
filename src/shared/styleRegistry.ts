// Style registry for Shadow DOM injection
// Each .styles.ts file uses css`` which auto-registers

const styleRegistry: string[] = [];

/**
 * CSS tagged template literal for syntax highlighting.
 * Automatically registers the styles with the global registry.
 */
export const css = (strings: TemplateStringsArray, ...values: unknown[]): string => {
  const result = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
  styleRegistry.push(result);
  return result;
};

/**
 * Register raw CSS string (e.g., from ?inline imports).
 * Only registers if not already present.
 */
export function registerRawStyles(styles: string): void {
  if (!styleRegistry.includes(styles)) {
    styleRegistry.push(styles);
  }
}

/**
 * Get all registered styles for Shadow DOM injection.
 */
export function getAllStyles(): string {
  return styleRegistry.join('\n');
}
