import { z } from "zod";
 
export interface IUpdateUserStatusPayload {
  status: "ACTIVE" | "BLOCKED";
}
 
const updateUserStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], {
    errorMap: () => ({ message: "status must be either ACTIVE or BLOCKED" }),
  }),
});
 
export const AdminValidation = {
  updateUserStatusZodSchema,
};
