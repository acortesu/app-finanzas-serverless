// services/categories/getCategory/service.ts

import { validateGetCategoryParams } from './schema'
import { getCategory } from './repository'

export type GetCategoryServiceParams = {
  userId: string
  categoryId?: string
}

export type CategoryDTO = {
  categoryId: string
  name: string
  color: string
  type: 'EXPENSE' | 'INCOME'
  createdAt: string
}

export async function getCategoryService({
  userId,
  categoryId
}: GetCategoryServiceParams): Promise<CategoryDTO> {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  const validatedCategoryId =
    validateGetCategoryParams(categoryId)

  const item = await getCategory({
    userId,
    categoryId: validatedCategoryId
  })

  return {
    categoryId: item.categoryId as string,
    name: item.name as string,
    color: item.color as string,
    type: item.type as 'EXPENSE' | 'INCOME',
    createdAt: item.createdAt as string
  }
}