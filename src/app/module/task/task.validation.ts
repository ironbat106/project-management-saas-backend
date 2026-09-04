import { z } from "zod";
 
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
  errorMap: () => ({ message: "priority must be one of LOW, MEDIUM, HIGH, URGENT" }),
});
 
const createTaskZodSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters long").max(200),
  description: z.string().trim().max(2000).optional(),
  priority: priorityEnum.optional(),
  sprintId: z.string().uuid("Invalid sprintId").optional(),
  assigneeId: z.string().uuid("Invalid assigneeId").optional(),
  dueDate: z.string().datetime({ message: "dueDate must be a valid ISO date" }).optional(),
});
 
const updateTaskZodSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters long").max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  priority: priorityEnum.optional(),
  sprintId: z.string().uuid("Invalid sprintId").optional(),
  dueDate: z.string().datetime({ message: "dueDate must be a valid ISO date" }).optional(),
});
 
const updateTaskStatusZodSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"], {
    errorMap: () => ({ message: "status must be one of TODO, IN_PROGRESS, IN_REVIEW, DONE" }),
  }),
});
 
const assignTaskZodSchema = z.object({
  assigneeId: z.string().uuid("A valid assigneeId is required"),
});
 
const createSubtaskZodSchema = z.object({
  title: z.string().trim().min(1, "Subtask title is required").max(200),
});
 
const createCommentZodSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(1000),
});
 
export const TaskValidation = {
  createTaskZodSchema,
  updateTaskZodSchema,
  updateTaskStatusZodSchema,
  assignTaskZodSchema,
  createSubtaskZodSchema,
  createCommentZodSchema,
};
