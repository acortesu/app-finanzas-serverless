// services/categories/createCategory/schema.ts

export type CreateCategoryInput = {
  name: string
  type: 'EXPENSE' | 'INCOME'
}

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateCreateCategoryInput(
  payload: unknown
): CreateCategoryInput {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body')
  }

  const { name, type } = payload as Record<string, unknown>

  if (!name || typeof name !== 'string') {
    throw new ValidationError('name is required and must be a string')
  }

  if (name.trim().length < 2) {
    throw new ValidationError('name must be at least 2 characters')
  }

  if (type !== 'EXPENSE' && type !== 'INCOME') {
    throw new ValidationError(
      'type must be either EXPENSE or INCOME'
    )
  }

  return {
    name: name.trim(),
    type
  }
}