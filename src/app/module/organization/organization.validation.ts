import { z } from "zod";
 
const createOrganizationZodSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters long").max(100),
  description: z.string().trim().max(500).optional(),
});
 
const updateOrganizationZodSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters long").max(100).optional(),
  description: z.string().trim().max(500).optional(),
});
 
const inviteMemberZodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
});
 
export const OrganizationValidation = {
  createOrganizationZodSchema,
  updateOrganizationZodSchema,
  inviteMemberZodSchema,
};
