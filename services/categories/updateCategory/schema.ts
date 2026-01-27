// services/categories/updateCategory/schema.ts

export type UpdateCategoryInput = {
  name?: string
  color?: string
}

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateUpdateCategoryInput(
  body: unknown
): UpdateCategoryInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid request body')
  }

  const { name, color } = body as Record<string, unknown>

  if (!name && !color) {
    throw new ValidationError(
      'At least one field (name or color) must be provided'
    )
  }

  if (name && typeof name !== 'string') {
    throw new ValidationError('name must be a string')
  }

  if (color && typeof color !== 'string') {
    throw new ValidationError('color must be a string')
  }

  return {
    name: name as string | undefined,
    color: color as string | undefined
  }
}