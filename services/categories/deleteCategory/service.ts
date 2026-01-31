// services/categories/deleteCategory/service.ts

import {
  softDeleteCategory,
  findExpensesByCategory,
  softDeleteExpenses,
  recalculateCategoryAggregates,
  CategoryNotFoundError,
  recalculateMonthAggregates,
} from "./repository";

type DeleteCategoryServiceParams = {
  userId: string;
  categoryId: string;
  cascade: boolean;
};

export class CategoryHasExpensesError extends Error {
  readonly statusCode = 409;

  constructor() {
    super("Category has associated expenses");
  }
}

export async function deleteCategoryService({
  userId,
  categoryId,
  cascade,
}: DeleteCategoryServiceParams): Promise<void> {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // 🔍 Buscar expenses asociados a la categoría
  const expenses = await findExpensesByCategory({
    userId,
    categoryId,
  });

  // 🚫 Bloquear si hay expenses y no hay cascade
  if (expenses.length > 0 && !cascade) {
    throw new CategoryHasExpensesError();
  }

  // 🧨 Cascade delete
  if (cascade && expenses.length > 0) {
    await softDeleteExpenses({
      userId,
      expenses,
    });

    // 🧮 Obtener meses afectados (únicos)
    const months = Array.from(new Set(expenses.map((e) => e.month)));

    if (months.length > 0) {
      await recalculateMonthAggregates({
        userId,
        months,
      });
    }

    // 🔄 Recalcular aggregates por categoría + mes
    await recalculateCategoryAggregates({
      userId,
      categoryId,
      months,
    });
  }

  // 🗑️ Soft delete categoría
  await softDeleteCategory({
    userId,
    categoryId,
  });
}

export { CategoryNotFoundError };
