// services/expenses/createExpense/service.ts

import {
  validateCreateExpense,
  ValidationError,
  CreateExpenseInput
} from './schema'
import { createExpense as createExpenseRepo } from './repository'

type CreateExpenseServiceParams = {
  userId: string
  payload: unknown
}

type CreateExpenseServiceResult = {
  expenseId: string
}

/**
 * Error de dominio (no HTTP)
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

/**
 * Caso de uso: createExpense
 */
export async function createExpenseService({
  userId,
  payload
}: CreateExpenseServiceParams): Promise<CreateExpenseServiceResult> {
  if (!userId) {
    throw new DomainError('User not authenticated')
  }

  // 1️⃣ Validación
  let input: CreateExpenseInput
  try {
    input = validateCreateExpense(payload)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new DomainError('Invalid expense payload')
  }

  // 2️⃣ Persistencia
  try {
    return await createExpenseRepo({
      userId,
      input
    })
  } catch (error) {
    // Aquí puedes mapear errores de DynamoDB más adelante
    console.error('DynamoDB error:', error)
    throw new DomainError('Failed to create expense')
  }
}