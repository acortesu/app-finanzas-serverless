// services/categories/getCategories/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda'

import { getCategoriesService } from './service'
import { ValidationError } from './schema'

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

    const queryParams = event.queryStringParameters || {}

    const result = await getCategoriesService({
      userId,
      queryParams
    })

    return response(200, result)
  } catch (error) {
    console.error('getCategories error:', error)

    if (error instanceof ValidationError) {
      return response(400, {
        error: 'VALIDATION_ERROR',
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