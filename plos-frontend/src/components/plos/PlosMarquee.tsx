/**
 * Editorial italic running ticker — divider between page sections.
 * Ported 1:1 from the prototype's scenes.jsx PlosMarquee.
 */
export function PlosMarquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="plos-marquee" aria-hidden>
      <div className="plos-marquee-track">
        {doubled.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  );
}
