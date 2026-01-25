// services/expenses/getExpense/schema.ts

export type GetExpenseParams = {
  expenseId: string
}

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Valida los path params de GET /expenses/{expenseId}
 */
export function validateGetExpenseParams(
  params: Record<string, string | undefined> | null
): GetExpenseParams {
  if (!params || !params.expenseId) {
    throw new ValidationError('expenseId is required')
  }

  const { expenseId } = params

  // UUID v4 simple validation
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      expenseId
    )
  ) {
    throw new ValidationError('expenseId must be a valid UUID')
  }

  return {
    expenseId
  }
}