import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IVendorProfile extends Document {
  userId: Types.ObjectId;
  storeName: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorProfileSchema = new Schema<IVendorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one vendor profile per user
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const VendorProfile = mongoose.model<IVendorProfile>("VendorProfile", VendorProfileSchema);
