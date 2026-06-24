import type { Meme } from '../types';

const fmtNum = (n: number) => n.toLocaleString();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

interface Props {
  memes: Meme[];
  loading: boolean;
  onEdit: (meme: Meme) => void;
  onDelete: (meme: Meme) => void;
}

export default function MemeTable({ memes, loading, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Meme</th>
            <th>Category</th>
            <th>Author</th>
            <th>Status</th>
            <th>Views</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {memes.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="meme-cell">
                  <div className={`thumb ${m.gradient}`}>{m.emoji}</div>
                  <div>
                    <div className="meme-title">{m.title}</div>
                    <div className="meme-id">#{m.id.slice(-6)}</div>
                  </div>
                </div>
              </td>
              <td>{m.category}</td>
              <td>{m.author}</td>
              <td>
                <span className={`badge ${m.status}`}>
                  {m.status === 'published' ? '● Published' : '○ Draft'}
                </span>
              </td>
              <td>{fmtNum(m.views)}</td>
              <td>{fmtDate(m.updatedAt)}</td>
              <td>
                <div className="row-actions">
                  <button className="btn" onClick={() => onEdit(m)}>
                    Edit
                  </button>
                  <button className="btn" onClick={() => onDelete(m)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && memes.length === 0 && <div className="empty">No memes match your filters.</div>}
      {loading && <div className="empty">Loading…</div>}
    </div>
  );
}
