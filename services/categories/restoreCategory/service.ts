import { restoreCategory } from './repository'
import {
  recalculateCategoryAggregates,
  recalculateMonthAggregates,
  findExpensesByCategory
} from '../deleteCategory/repository'

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
}): Promise<void> {
  // 1️⃣ Restore categoría
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

  // 2️⃣ Buscar expenses (incluye borrados, para saber los meses)
  const expenses = await findExpensesByCategory({
    userId,
    categoryId
  })

  if (expenses.length === 0) {
    return
  }

  // 3️⃣ Meses afectados
  const months = Array.from(
    new Set(expenses.map(e => e.month))
  )

  // 4️⃣ Recalcular MONTH aggregates
  await recalculateMonthAggregates({
    userId,
    months
  })

  // 5️⃣ Recalcular CATEGORY aggregates
  await recalculateCategoryAggregates({
    userId,
    categoryId,
    months
  })
}