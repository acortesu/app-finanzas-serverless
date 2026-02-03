// services/expenses/restoreExpense/handler.ts

import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  restoreExpenseService,
  ExpenseNotFoundError,
  ExpenseAlreadyActiveError,
  CategoryDeletedError
} from './service'

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub
    const expenseId = event.pathParameters?.expenseId

    if (!userId || !expenseId) {
      return { statusCode: 400 }
    }

    await restoreExpenseService({ userId, expenseId })

    return { statusCode: 204 }
  } catch (error: any) {
    if (error instanceof ExpenseNotFoundError) {
      return { statusCode: 404 }
    }
    if (
      error instanceof ExpenseAlreadyActiveError ||
      error instanceof CategoryDeletedError
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: error.message })
      }
    }

    return { statusCode: 500 }
  }
}