// services/expenses/createExpense/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import {
  createExpenseService,
  DomainError
} from './service'
import { ValidationError } from './schema'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 1️⃣ Obtener userId desde el authorizer
    const userId =
      event.requestContext.authorizer?.principalId ||
      event.requestContext.authorizer?.userId

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    // 2️⃣ Parsear body
    if (!event.body) {
      return response(400, {
        error: 'INVALID_BODY',
        message: 'Request body is required'
      })
    }

    const payload = JSON.parse(event.body)

    // 3️⃣ Ejecutar caso de uso
    const result = await createExpenseService({
      userId,
      payload
    })

    // 4️⃣ Success
    return response(201, {
      expenseId: result.expenseId,
      message: 'Expense created successfully'
    })
  } catch (error) {
    console.error('createExpense error:', error)

    // 🔹 Validation errors
    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    // 🔹 Domain errors
    if (error instanceof DomainError) {
      return response(500, {
        error: 'DOMAIN_ERROR',
        message: error.message
      })
    }

    // 🔹 Fallback
    return response(500, {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error'
    })
  }
}

/**
 * Helper para responses HTTP
 */
function response(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}