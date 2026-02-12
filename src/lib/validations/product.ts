import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  inventory: z.number().int().min(0, "Inventory must be positive"),
  category_id: z.string().uuid("Invalid category ID"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
