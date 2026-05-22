import type { ComponentType, CSSProperties, ReactNode } from 'react';

/**
 * Unified hero card used at the top of every PLOS module page
 * (Insights, Finance, Health, Habits, People, Timeline).
 *
 * Renders the eyebrow + serif headline + sub line on the left
 * and a cinematic SVG scene on the right. `--mh-accent` drives
 * the background gradient defined in cinema.css.
 */
export function PlosModuleHero({
  eyebrow,
  title,
  sub,
  scene: Scene,
  accent,
  actions,
}: {
  eyebrow: string;
  /** Plain text or HTML — `<em>…</em>` is allowed for serif accents. */
  title: string;
  sub?: ReactNode;
  scene: ComponentType;
  accent: string;
  actions?: ReactNode;
}) {
  const style = { ['--mh-accent' as string]: accent } as CSSProperties;
  return (
    <div className="plos-module-hero" style={style}>
      <div className="plos-module-hero-bg" />
      <div className="plos-module-hero-text">
        <div className="plos-page-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>
        <h1 className="plos-module-h1" dangerouslySetInnerHTML={{ __html: title }} />
        {sub && <div className="plos-module-sub">{sub}</div>}
      </div>
      {actions && <div className="plos-module-actions">{actions}</div>}
      <div className="plos-module-hero-scene">
        <Scene />
      </div>
    </div>
  );
}
