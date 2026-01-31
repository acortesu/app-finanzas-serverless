// services/expenses/getExpense/service.ts

import {
  validateGetExpenseParams
} from './schema'
import {
  getExpenseById,
  ExpenseItem
} from './repository'

/**
 * Error de dominio para recursos no encontrados
 * (se traduce a 404 en el handler)
 */
export class NotFoundError extends Error {
  readonly statusCode = 404

  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export type GetExpenseResult = {
  expenseId: string
  amount: number
  currency: string
  categoryId: string
  paymentMethod: string
  description?: string
  date: string
  createdAt: string
  updatedAt: string
}

/**
 * Caso de uso: obtener un expense por ID
 * Reglas de negocio:
 * - El repository debe retornar `undefined`
 *   si el expense NO existe o está `isDeleted = true`
 */
export async function getExpenseService(input: {
  userId: string
  pathParams: Record<string, string | undefined> | null
}): Promise<GetExpenseResult> {
  const { userId, pathParams } = input

  // Validar input (path params)
  const { expenseId } =
    validateGetExpenseParams(pathParams)

  // Obtener desde DynamoDB
  const item: ExpenseItem | undefined =
    await getExpenseById(userId, expenseId)

  // No existe o está soft-deleted
  if (!item) {
    throw new NotFoundError('Expense not found')
  }

  // 4️⃣ Mapear al output del dominio
  return {
    expenseId: item.expenseId,
    amount: item.amount,
    currency: item.currency,
    categoryId: item.categoryId,
    paymentMethod: item.paymentMethod,
    description: item.description,
    date: item.date,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}