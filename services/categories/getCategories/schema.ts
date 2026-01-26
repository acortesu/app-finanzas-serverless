// services/categories/getCategories/schema.ts

export type CategoryType = 'EXPENSE' | 'INCOME'

export type GetCategoriesQuery = {
  type: CategoryType
}

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateGetCategoriesQuery(
  query: Record<string, string | undefined>
): GetCategoriesQuery {
  const { type } = query

  if (!type) {
    throw new ValidationError('type query parameter is required')
  }

  if (type !== 'EXPENSE' && type !== 'INCOME') {
    throw new ValidationError('type must be either EXPENSE or INCOME')
  }

  return { type }
}