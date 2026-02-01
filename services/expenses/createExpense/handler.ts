import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { createExpenseService, DomainError } from "./service";
import { ValidationError } from "./schema";

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // 🔐 Obtener userId desde Cognito JWT
    const claims = event.requestContext.authorizer?.claims as any;
    const userId = claims?.sub;

    if (!userId) {
      return response(401, {
        error: "UNAUTHORIZED",
        message: "Missing user authentication",
      });
    }

    // 🧾 Parsear body
    if (!event.body) {
      return response(400, {
        error: "INVALID_BODY",
        message: "Request body is required",
      });
    }

    const payload = JSON.parse(event.body);

    // 🚀 Ejecutar caso de uso
    const result = await createExpenseService({
      userId,
      payload,
    });

    return response(201, {
      expenseId: result.expenseId,
      message: "Expense created successfully",
    });
  } catch (error) {
    console.error("createExpense error:", error);

    if (error instanceof DomainError) {
      return response(400, {
        error: "DOMAIN_ERROR",
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return response(400, {
        error: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    return response(500, {
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error",
    });
  }
};

function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
