// services/categories/createCategory/schema.ts

export type CreateCategoryInput = {
  name: string;
  color: string;
  type: "EXPENSE" | "INCOME";
};

export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateCreateCategoryInput(
  payload: Record<string, unknown>
): CreateCategoryInput {
  const { name, color, type } = payload

  if (!name || typeof name !== 'string') {
    throw new ValidationError('name is required')
  }

  if (!color || typeof color !== 'string') {
    throw new ValidationError('color is required')
  }

  if (type !== 'EXPENSE' && type !== 'INCOME') {
    throw new ValidationError('type must be either EXPENSE or INCOME')
  }

  return { name, color, type }
}
