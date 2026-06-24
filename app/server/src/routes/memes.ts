import { Router, Request, Response, NextFunction } from 'express';
import { MemeModel, CATEGORIES } from '../models/Meme';

const router = Router();

const EMOJIS = ['😂', '🔥', '🧠', '⚡', '😳', '🙌', '👀', '💀', '🎉', '🤔'];
const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Wrap async handlers so rejected promises reach the error middleware. */
const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/stats',
  wrap(async (_req, res) => {
    const [total, published, drafts, agg] = await Promise.all([
      MemeModel.countDocuments(),
      MemeModel.countDocuments({ status: 'published' }),
      MemeModel.countDocuments({ status: 'draft' }),
      MemeModel.aggregate<{ _id: null; views: number }>([
        { $group: { _id: null, views: { $sum: '$views' } } },
      ]),
    ]);
    res.json({ total, published, drafts, totalViews: agg[0]?.views ?? 0 });
  })
);

router.get(
  '/',
  wrap(async (req, res) => {
    const { status, q } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (q) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ title: rx }, { author: rx }, { category: rx }];
    }
    const memes = await MemeModel.find(filter).sort({ createdAt: -1 });
    res.json(memes);
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    const meme = await MemeModel.findById(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Not found' });
    res.json(meme);
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const { title, category, author, status } = req.body ?? {};
    const meme = await MemeModel.create({
      title,
      category,
      author,
      status,
      emoji: pick(EMOJIS),
      gradient: pick(GRADIENTS),
    });
    res.status(201).json(meme);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    const { title, category, author, status } = req.body ?? {};
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (category !== undefined) update.category = category;
    if (author !== undefined) update.author = author;
    if (status !== undefined) update.status = status;
    const meme = await MemeModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!meme) return res.status(404).json({ error: 'Not found' });
    res.json(meme);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const meme = await MemeModel.findByIdAndDelete(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Not found' });
    res.json(meme);
  })
);

export const categories = CATEGORIES;
export default router;
