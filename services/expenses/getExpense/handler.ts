// services/expenses/getExpense/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import {
  getExpenseService,
  NotFoundError
} from './service'
import {
  ValidationError
} from './schema'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔐 Obtener userId desde Cognito authorizer
    const claims = event.requestContext.authorizer?.claims as any
    const userId = claims?.sub

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    // 🚀 Ejecutar caso de uso
    const result = await getExpenseService({
      userId,
      pathParams: event.pathParameters
    })

    // ✅ Success
    return response(200, result)
  } catch (error: unknown) {
    console.error('getExpense error:', error)

    // 🔹 Input inválido
    if (error instanceof ValidationError) {
      return response(error.statusCode, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    // 🔹 Recurso no encontrado
    if (error instanceof NotFoundError) {
      return response(error.statusCode, {
        error: 'EXPENSE_NOT_FOUND',
        message: error.message
      })
    }

    // 🔹 Fallback
    if (error instanceof Error) {
      return response(500, {
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })
    }

    return response(500, {
      error: 'UNKNOWN_ERROR',
      message: 'Unexpected error'
    })
  }
}

/**
 * Helper para respuestas HTTP
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