// services/expenses/deleteExpense/service.ts

import {
  softDeleteExpense,
  findExpenseById,
  findExpensesByMonth,
  recalculateMonthAggregate,
  recalculateCategoryAggregate,
} from "./repository";

export class ExpenseNotFoundError extends Error {
  readonly statusCode = 404;

  constructor() {
    super("Expense not found");
  }
}

export async function deleteExpenseService(params: {
  userId: string;
  expenseId: string;
}): Promise<void> {
  const { userId, expenseId } = params;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // 1️⃣ Obtener expense (y validar que exista)
  const expense = await findExpenseById({
    userId,
    expenseId,
  });

  if (!expense) {
    throw new ExpenseNotFoundError();
  }

  const { month, categoryId } = expense;

  // 2️⃣ Soft delete del expense
  await softDeleteExpense({
    userId,
    expenseId,
  });

  // 3️⃣ Recalcular MONTH aggregate
  const monthExpenses = await findExpensesByMonth({
    userId,
    month,
  });

  await recalculateMonthAggregate({
    userId,
    month,
    expenses: monthExpenses,
  });

  // 4️⃣ Recalcular CATEGORY + MONTH aggregate
  const categoryExpenses = monthExpenses.filter(
    (e) => e.categoryId === categoryId,
  );

  await recalculateCategoryAggregate({
    userId,
    categoryId,
    month,
    expenses: categoryExpenses,
  });
}
