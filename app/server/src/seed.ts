import { MemeModel } from './models/Meme';

const SEED = [
  { title: 'Distracted Boyfriend', category: 'Classic', author: 'Maya Cohen', status: 'published', emoji: '😳', gradient: 'g1', views: 12840 },
  { title: 'This Is Fine', category: 'Reaction', author: 'Daniel Levi', status: 'published', emoji: '🔥', gradient: 'g2', views: 9821 },
  { title: 'Drake Hotline Bling', category: 'Classic', author: 'Maya Cohen', status: 'published', emoji: '🙅', gradient: 'g3', views: 7430 },
  { title: 'Galaxy Brain', category: 'Wholesome', author: 'Noa Bar', status: 'draft', emoji: '🧠', gradient: 'g4', views: 0 },
  { title: 'Surprised Pikachu', category: 'Reaction', author: 'Daniel Levi', status: 'published', emoji: '⚡', gradient: 'g5', views: 15302 },
  { title: 'Two Buttons', category: 'Decisions', author: 'Noa Bar', status: 'draft', emoji: '😰', gradient: 'g6', views: 0 },
  { title: 'Success Kid', category: 'Wholesome', author: 'Maya Cohen', status: 'published', emoji: '✊', gradient: 'g1', views: 4218 },
  { title: 'Woman Yelling at Cat', category: 'Classic', author: 'Daniel Levi', status: 'published', emoji: '😾', gradient: 'g2', views: 6610 },
];

/** Insert seed content only when the collection is empty. */
export async function seedIfEmpty(): Promise<void> {
  const count = await MemeModel.countDocuments();
  if (count === 0) {
    await MemeModel.insertMany(SEED);
    console.log(`Seeded ${SEED.length} memes`);
  }
}
