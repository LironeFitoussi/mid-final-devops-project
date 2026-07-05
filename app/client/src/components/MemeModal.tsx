import { useEffect, useState } from 'react';
import type { Meme, MemeInput, MemeStatus } from '../types';

interface Props {
  open: boolean;
  meme: Meme | null;
  categories: string[];
  onClose: () => void;
  onSave: (input: MemeInput) => void;
}

const EMPTY: MemeInput = { title: '', category: 'Classic', author: '', status: 'draft' };

export default function MemeModal({ open, meme, categories, onClose, onSave }: Props) {
  const [form, setForm] = useState<MemeInput>(EMPTY);

  useEffect(() => {
    if (meme) {
      setForm({ title: meme.title, category: meme.category, author: meme.author, status: meme.status });
    } else {
      setForm({ ...EMPTY, category: categories[0] ?? 'Classic' });
    }
  }, [meme, open, categories]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{meme ? 'Edit Meme' : 'New Meme'}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Title
            <input
              type="text"
              required
              placeholder="e.g. Distracted Boyfriend"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Author
            <input
              type="text"
              placeholder="e.g. Maya Cohen"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MemeStatus })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
