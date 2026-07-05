export type MemeStatus = 'published' | 'draft';

export interface Meme {
  id: string;
  title: string;
  category: string;
  author: string;
  status: MemeStatus;
  emoji: string;
  gradient: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
}

export interface MemeInput {
  title: string;
  category: string;
  author: string;
  status: MemeStatus;
}
