import { z } from "zod";
 
const createCheckoutZodSchema = z.object({
  organizationId: z.string().uuid("A valid organizationId is required"),
  plan: z.enum(["PRO", "BUSINESS"], {
    errorMap: () => ({ message: "plan must be either PRO or BUSINESS" }),
  }),
});
 
export const PaymentValidation = {
  createCheckoutZodSchema,
};
