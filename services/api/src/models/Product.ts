import mongoose, { Schema, type Document } from "mongoose";

export type ProductTag = "New" | "Sale" | "Bestseller";
export type ProductCategory = "women" | "men" | "accessories" | "new-arrivals" | "sale";

export interface IProduct extends Document {
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  category: ProductCategory[];
  sizes: string[];
  tag: ProductTag | null;
  isPublished: boolean;
  vendorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: [String],
      enum: ["women", "men", "accessories", "new-arrivals", "sale"],
      default: [],
    },
    sizes: { type: [String], default: [] },
    tag: {
      type: String,
      enum: ["New", "Sale", "Bestseller", null],
      default: null,
    },
    isPublished: { type: Boolean, default: false },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Index for fast slug lookup and category filtering
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isPublished: 1 });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
