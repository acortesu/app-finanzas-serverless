// services/expenses/getExpenses/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import { getExpensesService } from './service'
import { ValidationError } from './schema'
import { DomainError } from '../createExpense/service' // reutilizamos DomainError

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 1️⃣ Obtener userId (temporal en dev)
    const userId =
      event.requestContext.authorizer?.principalId ||
      event.requestContext.authorizer?.userId ||
      'dev-user'

    // 2️⃣ Query params
    const queryParams = event.queryStringParameters || {}

    // 3️⃣ Ejecutar caso de uso
    const result = await getExpensesService({
      userId,
      queryParams
    })

    return response(200, result)
  } catch (error) {
    console.error('getExpenses error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    if (error instanceof DomainError) {
      return response(500, {
        error: 'DOMAIN_ERROR',
        message: error.message
      })
    }

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