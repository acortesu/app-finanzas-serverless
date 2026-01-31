// services/categories/deleteCategory/handler.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import {
  deleteCategoryService,
  CategoryNotFoundError,
  CategoryHasExpensesError,
} from "./service";

import { validateDeleteCategoryQuery } from "./schema";

function response(
  statusCode: number,
  body?: Record<string, unknown>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "",
  };
}

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Auth
    const claims = event.requestContext.authorizer?.claims as any;
    const userId = claims?.sub;

    if (!userId) {
      return response(401, {
        error: "UNAUTHORIZED",
        message: "Missing user authentication",
      });
    }

    // Path param
    const categoryId = event.pathParameters?.categoryId;
    if (!categoryId) {
      return response(400, {
        error: "INVALID_PATH",
        message: "categoryId is required",
      });
    }

    // Query param (cascade)
    const { cascade } = validateDeleteCategoryQuery(
      event.queryStringParameters ?? {},
    );

    // Delete (single call, correct contract)
    await deleteCategoryService({
      userId,
      categoryId,
      cascade,
    });

    // 204 No Content
    return {
      statusCode: 204,
      body: "",
    };
  } catch (error) {
    console.error("deleteCategory error:", error);

    if (error instanceof CategoryNotFoundError) {
      return response(404, {
        error: "CATEGORY_NOT_FOUND",
        message: error.message,
      });
    }

    if (error instanceof CategoryHasExpensesError) {
      return response(409, {
        error: "CATEGORY_HAS_EXPENSES",
        message: error.message,
      });
    }

    return response(500, {
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error",
    });
  }
};