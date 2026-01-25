// services/expenses/deleteExpense/schema.ts

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateExpenseId(expenseId?: string): string {
  if (!expenseId) {
    throw new ValidationError('expenseId is required')
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(expenseId)) {
    throw new ValidationError('expenseId must be a valid UUID')
  }

  return expenseId
}