import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

export const CATEGORIES = ['Classic', 'Reaction', 'Wholesome', 'Decisions'] as const;
export const STATUSES = ['published', 'draft'] as const;

const memeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: CATEGORIES, default: 'Classic' },
    author: { type: String, default: 'Anonymous', trim: true, maxlength: 80 },
    status: { type: String, enum: STATUSES, default: 'draft' },
    emoji: { type: String, default: '😂' },
    gradient: { type: String, default: 'g1' },
    views: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

export type Meme = InferSchemaType<typeof memeSchema>;
export type MemeDocument = HydratedDocument<Meme>;

export const MemeModel = model('Meme', memeSchema);
