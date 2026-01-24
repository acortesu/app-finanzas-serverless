// services/expenses/getExpenses/service.ts

import {
  validateGetExpensesQuery,
  ValidationError,
  GetExpensesQuery
} from './schema'
import { getExpenses } from './repository'

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

type GetExpensesServiceParams = {
  userId: string
  queryParams: Record<string, string | undefined>
}

type ExpenseDTO = {
  expenseId: string
  amount: number
  currency: string
  categoryId: string
  description?: string
  date: string
  paymentMethod?: string
  tags?: string[]
}

type GetExpensesServiceResult = {
  items: ExpenseDTO[]
  nextCursor?: string
}

/**
 * Caso de uso: GET /expenses
 */
export async function getExpensesService({
  userId,
  queryParams
}: GetExpensesServiceParams): Promise<GetExpensesServiceResult> {
  if (!userId) {
    throw new DomainError('User not authenticated')
  }

  // 1️⃣ Validación de query params
  let query: GetExpensesQuery
  try {
    query = validateGetExpensesQuery(queryParams)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new DomainError('Invalid query parameters')
  }

  // 2️⃣ Query a DynamoDB
  const { items, nextCursor } = await getExpenses({
    userId,
    query
  })

  // 3️⃣ Mapear solo EXPENSE items
  const expenses: ExpenseDTO[] = items
    .filter(item => item.entityType === 'EXPENSE')
    .map(item => ({
      expenseId: item.expenseId as string,
      amount: item.amount as number,
      currency: item.currency as string,
      categoryId: item.categoryId as string,
      description: item.description as string | undefined,
      date: item.date as string,
      paymentMethod: item.paymentMethod as string | undefined,
      tags: item.tags as string[] | undefined
    }))

  return {
    items: expenses,
    nextCursor
  }
}