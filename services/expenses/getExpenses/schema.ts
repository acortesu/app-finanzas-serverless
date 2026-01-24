// services/expenses/getExpenses/schema.ts

export type GetExpensesQuery =
  | {
      type: 'MONTH'
      month: string // YYYY-MM
      limit: number
      cursor?: string
    }
  | {
      type: 'RANGE'
      from: string // YYYY-MM-DD
      to: string   // YYYY-MM-DD
      limit: number
      cursor?: string
    }

export class ValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export function validateGetExpensesQuery(
  query: Record<string, string | undefined>
): GetExpensesQuery {
  const { month, from, to, limit, cursor } = query

  // limit
  let parsedLimit = DEFAULT_LIMIT
  if (limit !== undefined) {
    const n = Number(limit)
    if (Number.isNaN(n) || n <= 0 || n > MAX_LIMIT) {
      throw new ValidationError(
        `limit must be a number between 1 and ${MAX_LIMIT}`
      )
    }
    parsedLimit = n
  }

  // MONTH mode
  if (month) {
    if (from || to) {
      throw new ValidationError(
        'Use either month or from/to, not both'
      )
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new ValidationError('month must be in YYYY-MM format')
    }

    return {
      type: 'MONTH',
      month,
      limit: parsedLimit,
      cursor
    }
  }

  // RANGE mode
  if (from || to) {
    if (!from || !to) {
      throw new ValidationError(
        'Both from and to are required for date range'
      )
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new ValidationError('from must be in YYYY-MM-DD format')
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new ValidationError('to must be in YYYY-MM-DD format')
    }

    if (from > to) {
      throw new ValidationError('from cannot be greater than to')
    }

    return {
      type: 'RANGE',
      from,
      to,
      limit: parsedLimit,
      cursor
    }
  }

  throw new ValidationError(
    'Either month or from/to query parameters are required'
  )
}