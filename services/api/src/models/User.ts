import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "vendor";
  // Hashed refresh tokens stored here to allow revocation per-device
  refreshTokenHashes: string[];
  // Password reset token (SHA-256 hash) and its expiry
  passwordResetTokenHash: string | null;
  passwordResetExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["customer", "admin", "vendor"], default: "customer" },
    refreshTokenHashes: { type: [String], default: [] },
    // select: false — never returned in API responses unless explicitly requested
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiry: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

// Prevent leaking passwordHash and refreshTokenHashes in JSON responses
UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any) {
    delete ret.passwordHash;
    delete ret.refreshTokenHashes;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", UserSchema);
