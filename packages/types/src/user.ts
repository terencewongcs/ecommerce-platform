import { z } from "zod";

export const UserRoleSchema = z.enum(["customer", "admin", "vendor"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ApiUserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ApiUser = z.infer<typeof ApiUserSchema>;
