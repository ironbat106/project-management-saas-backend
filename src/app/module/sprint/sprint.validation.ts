import { z } from "zod";
 
const createSprintZodSchema = z
  .object({
    name: z.string().trim().min(2, "Sprint name must be at least 2 characters long").max(100),
    startDate: z.string().datetime({ message: "startDate must be a valid ISO date" }),
    endDate: z.string().datetime({ message: "endDate must be a valid ISO date" }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });
 
const updateSprintStatusZodSchema = z.object({
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED"], {
    errorMap: () => ({ message: "status must be one of PLANNED, ACTIVE, COMPLETED" }),
  }),
});
 
export const SprintValidation = {
  createSprintZodSchema,
  updateSprintStatusZodSchema,
};
