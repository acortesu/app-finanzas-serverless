import {
  validateUpdateExpenseInput,
  ValidationError
} from './schema'
import {
  updateExpense,
  ExpenseNotFoundError
} from './repository'

export class DomainError extends Error {}

type UpdateExpenseServiceParams = {
  userId: string
  expenseId: string
  payload: unknown
}

export async function updateExpenseService({
  userId,
  expenseId,
  payload
}: UpdateExpenseServiceParams): Promise<void> {
  const updates = validateUpdateExpenseInput(payload)

  try {
    await updateExpense({
      userId,
      expenseId,
      updates
    })
  } catch (error) {
    if (error instanceof ExpenseNotFoundError) {
      throw error
    }
    if (error instanceof ValidationError) {
      throw error
    }
    throw new DomainError('Failed to update expense')
  }
}