// services/expenses/createExpense/schema.ts

export type CreateExpenseInput = {
  amount: number
  currency: string
  categoryId: string
  description?: string
  date: string
  paymentMethod?: 'cash' | 'debit_card' | 'credit_card'
  tags?: string[]
}

export class ValidationError extends Error {
  public readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateCreateExpense(
  payload: unknown
): CreateExpenseInput {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid request body')
  }

  const body = payload as Record<string, unknown>

  // amount
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    throw new ValidationError('Amount must be a number greater than zero')
  }

  // currency
  if (
    typeof body.currency !== 'string' ||
    !/^[A-Z]{3}$/.test(body.currency)
  ) {
    throw new ValidationError('Invalid currency format')
  }

  // categoryId
  if (typeof body.categoryId !== 'string') {
    throw new ValidationError('categoryId is required')
  }

  // description
  let description: string | undefined
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new ValidationError('description must be a string')
    }
    description = body.description
  }

  // date
  if (
    typeof body.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
  ) {
    throw new ValidationError('date must be in YYYY-MM-DD format')
  }

  const parsedDate = new Date(body.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (parsedDate > today) {
    throw new ValidationError('date cannot be in the future')
  }

  // paymentMethod
  let paymentMethod:
    | 'cash'
    | 'debit_card'
    | 'credit_card'
    | undefined

  const allowedPaymentMethods = ['cash', 'debit_card', 'credit_card']

  if (body.paymentMethod !== undefined) {
    if (
      typeof body.paymentMethod !== 'string' ||
      !allowedPaymentMethods.includes(body.paymentMethod)
    ) {
      throw new ValidationError('Invalid paymentMethod')
    }
    paymentMethod = body.paymentMethod as typeof paymentMethod
  }

  // tags
  let tags: string[] | undefined

  if (body.tags !== undefined) {
    if (
      !Array.isArray(body.tags) ||
      !body.tags.every(tag => typeof tag === 'string')
    ) {
      throw new ValidationError('tags must be an array of strings')
    }
    tags = body.tags
  }

  return {
    amount: body.amount,
    currency: body.currency,
    categoryId: body.categoryId,
    description,
    date: body.date,
    paymentMethod,
    tags
  }
}