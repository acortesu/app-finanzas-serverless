import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { deleteExpenseService } from "./service";

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // ✅ Cognito userId correcto
    const claims = event.requestContext.authorizer?.claims as
      | { sub?: string }
      | undefined;

    const userId = claims?.sub;

    if (!userId) {
      return response(401, {
        error: "UNAUTHORIZED",
        message: "Missing user authentication",
      });
    }

    const expenseId = event.pathParameters?.expenseId;

    if (!expenseId) {
      return response(400, {
        error: "INVALID_REQUEST",
        message: "expenseId is required",
      });
    }

    await deleteExpenseService({
      userId,
      expenseId,
    });

    return response(204, {});
  } catch (error) {
    console.error("deleteExpense error:", error);

    return response(500, {
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error",
    });
  }
};

function response(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: statusCode === 204 ? "" : JSON.stringify(body),
  };
}