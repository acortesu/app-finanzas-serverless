export type UpdateExpenseInput = {
  amount?: number
  currency?: string
  categoryId?: string
  description?: string
  paymentMethod?: string
  tags?: string[]
  date?: string // YYYY-MM-DD
}

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateUpdateExpenseInput(
  input: unknown
): UpdateExpenseInput {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('Invalid request body')
  }

  const data = input as Record<string, unknown>
  const result: UpdateExpenseInput = {}

  if ('amount' in data) {
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      throw new ValidationError('amount must be a positive number')
    }
    result.amount = data.amount
  }

  if ('currency' in data) {
    if (typeof data.currency !== 'string') {
      throw new ValidationError('currency must be a string')
    }
    result.currency = data.currency
  }

  if ('categoryId' in data) {
    if (typeof data.categoryId !== 'string') {
      throw new ValidationError('categoryId must be a string')
    }
    result.categoryId = data.categoryId
  }

  if ('description' in data) {
    if (typeof data.description !== 'string') {
      throw new ValidationError('description must be a string')
    }
    result.description = data.description
  }

  if ('paymentMethod' in data) {
    if (typeof data.paymentMethod !== 'string') {
      throw new ValidationError('paymentMethod must be a string')
    }
    result.paymentMethod = data.paymentMethod
  }

  if ('tags' in data) {
    if (
      !Array.isArray(data.tags) ||
      !data.tags.every(t => typeof t === 'string')
    ) {
      throw new ValidationError('tags must be an array of strings')
    }
    result.tags = data.tags
  }

  if ('date' in data) {
    if (
      typeof data.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
    ) {
      throw new ValidationError('date must be in YYYY-MM-DD format')
    }
    result.date = data.date
  }

  if (Object.keys(result).length === 0) {
    throw new ValidationError('At least one field must be provided')
  }

  return result
}