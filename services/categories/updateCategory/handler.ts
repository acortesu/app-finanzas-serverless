// services/categories/updateCategory/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import {
  updateCategoryService,
  ValidationError,
  CategoryNotFoundError
} from './service'

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

    if (!event.body) {
      return response(400, {
        error: 'INVALID_BODY',
        message: 'Request body is required'
      })
    }

    await updateCategoryService({
      userId,
      categoryId: categoryId!,
      body: JSON.parse(event.body)
    })

    return response(200, {
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('updateCategory error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

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