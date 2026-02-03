// services/expenses/restoreExpense/service.ts

import { restoreExpense } from './repository'
import {
  recalculateMonthAggregate,
  recalculateCategoryAggregate,
  findExpensesByMonth
} from '../deleteExpense/repository'
import { getCategory } from '../../categories/getCategory/repository'

export class ExpenseNotFoundError extends Error {
  statusCode = 404
  constructor() {
    super('Expense not found')
  }
}

export class ExpenseAlreadyActiveError extends Error {
  statusCode = 409
  constructor() {
    super('Expense is already active')
  }
}

export class CategoryDeletedError extends Error {
  statusCode = 409
  constructor() {
    super('Cannot restore expense because category is deleted')
  }
}

export async function restoreExpenseService({
  userId,
  expenseId
}: {
  userId: string
  expenseId: string
}) {
  const expense = await restoreExpense({
    userId,
    expenseId
  })

  if (!expense) {
    throw new ExpenseNotFoundError()
  }

  // ✅ Segunda vez restore → 409
  if (expense.isDeleted !== true) {
    throw new ExpenseAlreadyActiveError()
  }

  // 🔎 Validar categoría
  const category = await getCategory({
    userId,
    categoryId: expense.categoryId
  })

  if (category.isDeleted === true) {
    throw new CategoryDeletedError()
  }

  const { month, categoryId } = expense

  // 🔄 Recalcular MONTH
  const monthExpenses = await findExpensesByMonth({
    userId,
    month
  })

  await recalculateMonthAggregate({
    userId,
    month,
    expenses: monthExpenses
  })

  // 🔄 Recalcular CATEGORY + MONTH
  const categoryExpenses = monthExpenses.filter(
    e => e.categoryId === categoryId
  )

  await recalculateCategoryAggregate({
    userId,
    categoryId,
    month,
    expenses: categoryExpenses
  })
}