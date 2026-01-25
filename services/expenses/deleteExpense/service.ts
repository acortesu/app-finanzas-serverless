// services/expenses/deleteExpense/service.ts

import { deleteExpense as deleteExpenseRepo } from './repository'

type DeleteExpenseServiceParams = {
  userId: string
  expenseId: string
}

export async function deleteExpenseService({
  userId,
  expenseId
}: DeleteExpenseServiceParams): Promise<void> {
  await deleteExpenseRepo({
    userId,
    expenseId
  })
}