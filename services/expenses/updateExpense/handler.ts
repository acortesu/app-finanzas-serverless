import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import { updateExpenseService } from './service'
import { ValidationError } from './schema'
import { ExpenseNotFoundError } from './repository'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId =
      event.requestContext.authorizer?.claims?.sub

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    const expenseId = event.pathParameters?.expenseId
    if (!expenseId) {
      return response(400, {
        error: 'INVALID_PATH',
        message: 'expenseId is required'
      })
    }

    if (!event.body) {
      return response(400, {
        error: 'INVALID_BODY',
        message: 'Request body is required'
      })
    }

    await updateExpenseService({
      userId,
      expenseId,
      payload: JSON.parse(event.body)
    })

    return response(200, {
      message: 'Expense updated successfully'
    })
  } catch (error) {
    console.error('updateExpense error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    if (error instanceof ExpenseNotFoundError) {
      return response(404, {
        error: 'EXPENSE_NOT_FOUND',
        message: error.message
      })
    }

    return response(500, {
      error: 'INTERNAL_SERVER_ERROR',
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}