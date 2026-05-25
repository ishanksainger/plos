import type { GlobalProvider } from '@ladle/react';
import '@nis/brand-tokens/tokens.css';
import '../src/ui.css';

/**
 * Wraps every story in a shell so brand-token vars resolve and we can
 * preview against both the NIS dark surface + the PLOS glass surface.
 * Toggle via the Background control in Ladle's right rail.
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const bg = (globalState.backgroundColor as string) || 'light';
  const shellClass = bg === 'dark' ? 'nis-dark' : 'nis-light';
  return <div className={shellClass}>{children}</div>;
};
