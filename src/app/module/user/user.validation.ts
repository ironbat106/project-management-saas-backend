import { z } from "zod";
import { AuthValidation } from "../auth/auth.validation.js";
 
const updateProfileZodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100).optional(),
});
 
const changePasswordZodSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: AuthValidation.passwordSchema,
});
 
export const UserValidation = {
  updateProfileZodSchema,
  changePasswordZodSchema,
};
