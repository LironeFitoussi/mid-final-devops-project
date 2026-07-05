import type { Stats } from '../types';

const fmt = (n: number) => n.toLocaleString();

export default function StatCards({ stats }: { stats: Stats | null }) {
  const cards = [
    { label: 'Total Memes', value: stats?.total },
    { label: 'Published', value: stats?.published },
    { label: 'Drafts', value: stats?.drafts },
    { label: 'Total Views', value: stats?.totalViews },
  ];
  return (
    <section className="stats">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value === undefined ? '—' : fmt(c.value)}</div>
        </div>
      ))}
    </section>
  );
}
