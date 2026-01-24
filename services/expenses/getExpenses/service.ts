// services/expenses/getExpenses/service.ts

import {
  validateGetExpensesQuery,
  ValidationError
} from './schema'
import { getExpenses } from './repository'

type RawExpenseItem = {
  entityType: 'EXPENSE'
  expenseId: string
  amount: number
  currency: string
  categoryId: string
  description?: string
  date: string
  paymentMethod?: string
  tags?: string[]
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

type GetExpensesServiceParams = {
  userId: string
  queryParams: Record<string, string | undefined>
}

type GetExpensesServiceResult = {
  items: ExpenseDTO[]
  nextCursor?: string
}

export async function getExpensesService({
  userId,
  queryParams
}: GetExpensesServiceParams): Promise<GetExpensesServiceResult> {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // 1️⃣ Validar query params
  const query = validateGetExpensesQuery(queryParams)

  // 2️⃣ Obtener data de DynamoDB
  const { items, nextCursor } = await getExpenses({
    userId,
    query
  })

  // 3️⃣ Mapear solo EXPENSE items
  const expenses: ExpenseDTO[] = (items as RawExpenseItem[])
    .filter(item => item.entityType === 'EXPENSE')
    .map(item => ({
      expenseId: item.expenseId,
      amount: item.amount,
      currency: item.currency,
      categoryId: item.categoryId,
      description: item.description,
      date: item.date,
      paymentMethod: item.paymentMethod,
      tags: item.tags
    }))

  return {
    items: expenses,
    nextCursor
  }
}