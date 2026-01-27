// services/categories/deleteCategory/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import {
  deleteCategoryService,
  CategoryNotFoundError
} from './service'

function response(
  statusCode: number,
  body?: Record<string, unknown>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : ''
  }
}

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const claims = event.requestContext.authorizer?.claims as any
    const userId = claims?.sub

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    const categoryId = event.pathParameters?.categoryId
    if (!categoryId) {
      return response(400, {
        error: 'INVALID_PATH',
        message: 'categoryId is required'
      })
    }

    await deleteCategoryService({ userId, categoryId })

    // ✅ 204 es correcto para DELETE
    return {
      statusCode: 204,
      body: ''
    }
  } catch (error) {
    console.error('deleteCategory error:', error)

    if (error instanceof CategoryNotFoundError) {
      return response(404, {
        error: 'CATEGORY_NOT_FOUND',
        message: error.message
      })
    }

    return response(500, {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error'
    })
  }
}