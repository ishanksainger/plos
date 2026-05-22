'use client';

export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {doubled.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  );
}
