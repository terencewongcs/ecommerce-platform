import mongoose, { Schema, type Document } from "mongoose";

// Flat cart item — no nested product object, all display fields stored directly
export interface ICartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  bg: string; // placeholder color used as image background
  size: string;
  quantity: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    bg: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }, // sub-documents don't need their own _id
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
