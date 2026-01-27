// services/categories/updateCategory/service.ts

import {
  validateUpdateCategoryInput,
  ValidationError
} from './schema'
import {
  updateCategory,
  CategoryNotFoundError
} from './repository'

type UpdateCategoryServiceParams = {
  userId: string
  categoryId: string
  body: unknown
}

export async function updateCategoryService({
  userId,
  categoryId,
  body
}: UpdateCategoryServiceParams): Promise<void> {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  if (!categoryId) {
    throw new ValidationError('categoryId is required')
  }

  const updates = validateUpdateCategoryInput(body)

  await updateCategory({
    userId,
    categoryId,
    updates
  })
}

export {
  ValidationError,
  CategoryNotFoundError
}