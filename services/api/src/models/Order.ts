import mongoose, { Schema, type Document } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  size: string;
  quantity: number;
  unitPrice: number; // price at time of purchase, not current price
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }, // sub-documents don't need their own _id
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
