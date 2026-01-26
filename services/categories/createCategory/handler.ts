// services/categories/createCategory/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import { createCategoryService } from './service'
import { ValidationError } from './schema'

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔐 Obtener userId desde Cognito JWT
    const claims = event.requestContext.authorizer
      ?.claims as any
    const userId = claims?.sub

    if (!userId) {
      return response(401, {
        error: 'UNAUTHORIZED',
        message: 'Missing user authentication'
      })
    }

    if (!event.body) {
      return response(400, {
        error: 'INVALID_BODY',
        message: 'Request body is required'
      })
    }

    const payload = JSON.parse(event.body)

    const result = await createCategoryService({
      userId,
      payload
    })

    return response(201, {
      categoryId: result.categoryId,
      message: 'Category created successfully'
    })
  } catch (error: unknown) {
    console.error('createCategory error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
        message: error.message
      })
    }

    if (error instanceof Error && (error as any).statusCode) {
      return response((error as any).statusCode, {
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