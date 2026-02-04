// services/categories/restoreCategory/handler.ts

import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  restoreCategoryService,
  CategoryNotFoundError,
  CategoryAlreadyActiveError
} from './service'

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub
    const categoryId = event.pathParameters?.categoryId

    if (!userId || !categoryId) {
      return { statusCode: 400 }
    }

    await restoreCategoryService({ userId, categoryId })

    return { statusCode: 204 }
  } catch (error: any) {
    if (error instanceof CategoryNotFoundError) {
      return { statusCode: 404 }
    }

    if (error instanceof CategoryAlreadyActiveError) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Category already active' })
      }
    }

    return { statusCode: 500 }
  }
}