// services/expenses/getExpenses/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import { getExpensesService } from './service'
import { ValidationError } from './schema'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔐 userId (temporal en dev)
    const userId =
      event.requestContext.authorizer?.principalId ||
      event.requestContext.authorizer?.userId ||
      'dev-user'

    // 🧾 Query params
    const queryParams = event.queryStringParameters || {}

    // 🚀 Ejecutar caso de uso
    const result = await getExpensesService({
      userId,
      queryParams
    })

    return response(200, result)
  } catch (error: unknown) {
    console.error('getExpenses error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    if (error instanceof Error) {
      return response(500, {
        error: 'INTERNAL_ERROR',
        message: error.message
      })
    }

    return response(500, {
      error: 'UNKNOWN_ERROR',
      message: 'Unexpected error'
    })
  }
}

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