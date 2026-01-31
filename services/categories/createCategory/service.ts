// services/categories/createCategory/service.ts

import {
  validateCreateCategoryInput,
  ValidationError
} from './schema'
import {
  createCategory,
  CategoryAlreadyExistsError
} from './repository'

export { CategoryAlreadyExistsError }

export class DomainError extends Error {}

type CreateCategoryServiceParams = {
  userId: string
  payload: {
    name: string
    color: string
    type: 'EXPENSE' | 'INCOME'
  }
}

export async function createCategoryService({
  userId,
  payload
}: CreateCategoryServiceParams): Promise<{
  categoryId: string
}> {
  if (!userId) {
    throw new DomainError('User not authenticated')
  }

  let input
  try {
    input = validateCreateCategoryInput(payload)
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err
    }
    throw new DomainError('Invalid category data')
  }

  try {
    return await createCategory({
      userId,
      name: input.name,
      color: input.color,
      type: input.type
    })
  } catch (err) {
    if (err instanceof CategoryAlreadyExistsError) {
      const error = new Error(err.message)
      ;(error as any).statusCode = 409
      throw error
    }
    throw err
  }
}