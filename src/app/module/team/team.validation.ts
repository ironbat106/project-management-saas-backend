import { z } from "zod";
 
const createTeamZodSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters long").max(100),
});
 
const addTeamMemberZodSchema = z.object({
  userId: z.string().uuid("A valid userId is required"),
});
 
export const TeamValidation = {
  createTeamZodSchema,
  addTeamMemberZodSchema,
};
