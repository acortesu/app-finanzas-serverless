// services/categories/getCategory/schema.ts

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateGetCategoryParams(
  categoryId?: string
): string {
  if (!categoryId) {
    throw new ValidationError('categoryId is required')
  }

  return categoryId
}