// services/categories/restoreCategory/service.ts

import { restoreCategory } from './repository'

export class CategoryNotFoundError extends Error {
  statusCode = 404
}

export class CategoryAlreadyActiveError extends Error {
  statusCode = 409
}


export async function restoreCategoryService({
  userId,
  categoryId
}: {
  userId: string
  categoryId: string
}) {
  const category = await restoreCategory({
    userId,
    categoryId
  })

  if (!category) {
    throw new CategoryNotFoundError()
  }

  if (category.isDeleted !== true) {
    throw new CategoryAlreadyActiveError()
  }
}