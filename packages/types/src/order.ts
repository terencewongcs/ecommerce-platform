import { z } from "zod";

export const OrderStatusSchema = z.enum([
  "pending_payment",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const ApiOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});
export type ApiOrderItem = z.infer<typeof ApiOrderItemSchema>;

export const ApiShippingAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  city: z.string(),
  zip: z.string(),
});
export type ApiShippingAddress = z.infer<typeof ApiShippingAddressSchema>;

export const ApiOrderSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  items: z.array(ApiOrderItemSchema),
  status: OrderStatusSchema,
  shippingAddress: ApiShippingAddressSchema,
  subtotal: z.number(),
  tax: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  stripePaymentIntentId: z.string(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  refundReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ApiOrder = z.infer<typeof ApiOrderSchema>;

export const CreateOrderSchema = z.object({
  shippingAddress: ApiShippingAddressSchema,
  idempotencyKey: z.string().uuid(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
