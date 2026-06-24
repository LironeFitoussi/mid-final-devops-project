'use strict';

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const APP_VERSION = process.env.APP_VERSION || require('./package.json').version;
const STARTED_AT = new Date();

app.use(express.json());
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// In-memory content store. No external database, so the app runs standalone
// for the Layer 2 smoke test and survives a fresh pod with seed content.
// ---------------------------------------------------------------------------
let nextId = 1;
const memes = [];

function seed(data) {
  const now = Date.now();
  data.forEach((m, i) => {
    memes.push({
      id: nextId++,
      title: m.title,
      category: m.category,
      author: m.author,
      status: m.status,
      emoji: m.emoji,
      gradient: m.gradient,
      views: m.views,
      // stagger timestamps so the table has a believable timeline
      createdAt: new Date(now - (data.length - i) * 36e5).toISOString(),
      updatedAt: new Date(now - (data.length - i) * 36e5).toISOString(),
    });
  });
}

seed([
  { title: 'Distracted Boyfriend', category: 'Classic', author: 'Maya Cohen', status: 'published', emoji: '😳', gradient: 'g1', views: 12840 },
  { title: 'This Is Fine', category: 'Reaction', author: 'Daniel Levi', status: 'published', emoji: '🔥', gradient: 'g2', views: 9821 },
  { title: 'Drake Hotline Bling', category: 'Classic', author: 'Maya Cohen', status: 'published', emoji: '🙅', gradient: 'g3', views: 7430 },
  { title: 'Galaxy Brain', category: 'Wholesome', author: 'Noa Bar', status: 'draft', emoji: '🧠', gradient: 'g4', views: 0 },
  { title: 'Surprised Pikachu', category: 'Reaction', author: 'Daniel Levi', status: 'published', emoji: '⚡', gradient: 'g5', views: 15302 },
  { title: 'Two Buttons', category: 'Decisions', author: 'Noa Bar', status: 'draft', emoji: '😰', gradient: 'g6', views: 0 },
  { title: 'Success Kid', category: 'Wholesome', author: 'Maya Cohen', status: 'published', emoji: '✊', gradient: 'g1', views: 4218 },
  { title: 'Woman Yelling at Cat', category: 'Classic', author: 'Daniel Levi', status: 'published', emoji: '😾', gradient: 'g2', views: 6610 },
]);

const CATEGORIES = ['Classic', 'Reaction', 'Wholesome', 'Decisions'];
const EMOJIS = ['😂', '🔥', '🧠', '⚡', '😳', '🙌', '👀', '💀', '🎉', '🤔'];
const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function findMeme(id) {
  return memes.find((m) => m.id === Number(id));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Operational endpoints (consumed by Kubernetes probes and the release demo)
// ---------------------------------------------------------------------------
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/version', (_req, res) => {
  res.status(200).json({
    version: APP_VERSION,
    startedAt: STARTED_AT.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// ---------------------------------------------------------------------------
// Content API
// ---------------------------------------------------------------------------
app.get('/api/stats', (_req, res) => {
  const published = memes.filter((m) => m.status === 'published');
  const drafts = memes.filter((m) => m.status === 'draft');
  res.json({
    total: memes.length,
    published: published.length,
    drafts: drafts.length,
    totalViews: memes.reduce((sum, m) => sum + m.views, 0),
  });
});

app.get('/api/memes', (req, res) => {
  const { status, q } = req.query;
  let result = [...memes];
  if (status && status !== 'all') {
    result = result.filter((m) => m.status === status);
  }
  if (q) {
    const needle = String(q).toLowerCase();
    result = result.filter(
      (m) =>
        m.title.toLowerCase().includes(needle) ||
        m.author.toLowerCase().includes(needle) ||
        m.category.toLowerCase().includes(needle)
    );
  }
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(result);
});

app.get('/api/memes/:id', (req, res) => {
  const meme = findMeme(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  res.json(meme);
});

app.post('/api/memes', (req, res) => {
  const { title, category, author, status } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const now = new Date().toISOString();
  const meme = {
    id: nextId++,
    title: String(title).trim(),
    category: CATEGORIES.includes(category) ? category : 'Classic',
    author: author && String(author).trim() ? String(author).trim() : 'Anonymous',
    status: status === 'published' ? 'published' : 'draft',
    emoji: pick(EMOJIS),
    gradient: pick(GRADIENTS),
    views: 0,
    createdAt: now,
    updatedAt: now,
  };
  memes.push(meme);
  res.status(201).json(meme);
});

app.put('/api/memes/:id', (req, res) => {
  const meme = findMeme(req.params.id);
  if (!meme) return res.status(404).json({ error: 'Not found' });
  const { title, category, author, status } = req.body || {};
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: 'Title cannot be empty' });
    meme.title = String(title).trim();
  }
  if (category !== undefined && CATEGORIES.includes(category)) meme.category = category;
  if (author !== undefined && String(author).trim()) meme.author = String(author).trim();
  if (status !== undefined && ['published', 'draft'].includes(status)) meme.status = status;
  meme.updatedAt = new Date().toISOString();
  res.json(meme);
});

app.delete('/api/memes/:id', (req, res) => {
  const idx = memes.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = memes.splice(idx, 1);
  res.json(removed);
});

app.get('/api/categories', (_req, res) => res.json(CATEGORIES));

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, HOST, () => {
  console.log(`MemeForge CMS v${APP_VERSION} listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown so Kubernetes rollouts drain cleanly
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  server.close(() => process.exit(0));
}
['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));
