// services/categories/getCategories/service.ts

import {
  validateGetCategoriesQuery
} from './schema'
import { getCategories } from './repository'

export type CategoryDTO = {
  categoryId: string
  name: string
  color: string
  type: 'EXPENSE' | 'INCOME'
  createdAt: string
}

type GetCategoriesServiceParams = {
  userId: string
  queryParams: Record<string, string | undefined>
}

export async function getCategoriesService({
  userId,
  queryParams
}: GetCategoriesServiceParams): Promise<{ items: CategoryDTO[] }> {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  const { type } = validateGetCategoriesQuery(queryParams)

  const items = await getCategories({
    userId,
    type
  })

  const categories: CategoryDTO[] = items
    // 🔹 NUEVO: ocultar soft-deleted
    .filter((item: any) => item.isDeleted !== true)
    .map((item: any) => ({
      categoryId: item.categoryId,
      name: item.name,
      color: item.color,
      type: item.type,
      createdAt: item.createdAt
    }))

  return { items: categories }
}