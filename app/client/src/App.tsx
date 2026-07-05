import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { Meme, MemeInput, Stats } from './types';
import Sidebar from './components/Sidebar';
import StatCards from './components/StatCards';
import MemeTable from './components/MemeTable';
import MemeModal from './components/MemeModal';

type StatusFilter = 'all' | 'published' | 'draft';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

export default function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [version, setVersion] = useState('v—');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meme | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.getStats());
    } catch (err) {
      showToast((err as Error).message);
    }
  }, [showToast]);

  const loadMemes = useCallback(async () => {
    setLoading(true);
    try {
      setMemes(await api.getMemes({ status, q: query }));
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status, query, showToast]);

  // Initial load: version + categories.
  useEffect(() => {
    api.getVersion().then((v) => setVersion(`v${v.version}`)).catch(() => setVersion('v?'));
    api.getCategories().then(setCategories).catch(() => undefined);
  }, []);

  // Reload list when filters change (debounced for search).
  useEffect(() => {
    const t = window.setTimeout(loadMemes, 200);
    return () => window.clearTimeout(t);
  }, [loadMemes]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(async () => {
    await Promise.all([loadMemes(), loadStats()]);
  }, [loadMemes, loadStats]);

  const handleSave = async (input: MemeInput) => {
    try {
      if (editing) {
        await api.updateMeme(editing.id, input);
        showToast('Meme updated');
      } else {
        await api.createMeme(input);
        showToast('Meme created');
      }
      setModalOpen(false);
      setEditing(null);
      await refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleDelete = async (meme: Meme) => {
    if (!window.confirm(`Delete "${meme.title}"?`)) return;
    try {
      await api.deleteMeme(meme.id);
      showToast('Meme deleted');
      await refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (meme: Meme) => {
    setEditing(meme);
    setModalOpen(true);
  };

  return (
    <div className="layout">
      <Sidebar version={version} />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>Content Dashboard</h1>
            <p className="muted">Manage your meme catalog and publishing pipeline.</p>
          </div>
          <div className="topbar-actions">
            <input
              className="search"
              type="search"
              placeholder="Search memes, authors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn-primary" onClick={openNew}>
              + New Meme
            </button>
            <div className="avatar" title="Signed in">
              MC
            </div>
          </div>
        </header>

        <StatCards stats={stats} />

        <section className="panel">
          <div className="panel-head">
            <h2>All Content</h2>
            <div className="filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`chip${status === f.key ? ' active' : ''}`}
                  onClick={() => setStatus(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <MemeTable memes={memes} loading={loading} onEdit={openEdit} onDelete={handleDelete} />
        </section>
      </main>

      <MemeModal
        open={modalOpen}
        meme={editing}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
