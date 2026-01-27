// services/categories/getCategory/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'
import { getCategoryService, CategoryNotFoundError } from './service'
import { response } from '../../shared/http/response'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔐 userId desde Cognito
    const claims = event.requestContext.authorizer?.claims as any
    const userId = claims?.sub

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    const categoryId = event.pathParameters?.categoryId

    const category = await getCategoryService({
      userId,
      categoryId
    })

    return response(200, category)
  } catch (error: any) {
    if (error instanceof CategoryNotFoundError) {
      return response(404, {
        error: 'CATEGORY_NOT_FOUND',
        message: 'Category not found'
      })
    }
    const statusCode = error.statusCode ?? 500

    return response(statusCode, {
      error: error.name ?? 'INTERNAL_ERROR',
      message: error.message ?? 'Unexpected error'
    })
  }
}