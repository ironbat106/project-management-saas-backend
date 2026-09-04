import { z } from "zod";
 
const createProjectZodSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters long").max(150),
  description: z.string().trim().max(1000).optional(),
  teamId: z.string().uuid("Invalid teamId").optional(),
  startDate: z.string().datetime({ message: "startDate must be a valid ISO date" }).optional(),
  endDate: z.string().datetime({ message: "endDate must be a valid ISO date" }).optional(),
});
 
const updateProjectZodSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters long").max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  teamId: z.string().uuid("Invalid teamId").optional(),
  startDate: z.string().datetime({ message: "startDate must be a valid ISO date" }).optional(),
  endDate: z.string().datetime({ message: "endDate must be a valid ISO date" }).optional(),
});
 
const updateProjectStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"], {
    errorMap: () => ({ message: "status must be one of ACTIVE, ARCHIVED, COMPLETED" }),
  }),
});
 
export const ProjectValidation = {
  createProjectZodSchema,
  updateProjectZodSchema,
  updateProjectStatusZodSchema,
};
