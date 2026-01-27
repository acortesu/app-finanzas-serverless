// services/categories/deleteCategory/service.ts

import { deleteCategory, CategoryNotFoundError } from './repository'

type DeleteCategoryServiceParams = {
  userId: string
  categoryId: string
}

export async function deleteCategoryService({
  userId,
  categoryId
}: DeleteCategoryServiceParams): Promise<void> {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  await deleteCategory({ userId, categoryId })
}

export { CategoryNotFoundError }