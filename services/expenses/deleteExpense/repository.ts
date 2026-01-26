// services/expenses/deleteExpense/repository.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;
if (!TABLE_NAME) {
  throw new Error("TABLE_NAME environment variable is not set");
}

type DeleteExpenseParams = {
  userId: string;
  expenseId: string;
};

export async function deleteExpense({
  userId,
  expenseId,
}: DeleteExpenseParams): Promise<void> {
  const pk = `USER#${userId}`;

  // 1️⃣ Buscar el expense (para obtener el SK exacto)
  const query = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":sk": `EXPENSE#`,
      },
    }),
  );

  const item = query.Items?.find((i) => i.expenseId === expenseId);

  if (!item) {
    const error = new Error("Expense not found");
    (error as any).statusCode = 404;
    throw error;
  }

  const month = item.date.slice(0, 7);

  // 2️⃣ Delete
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: {
              PK: pk,
              SK: item.SK,
            },
          },
        },

        {
          Update: {
            TableName: TABLE_NAME,
            Key: {
              PK: pk,
              SK: `MONTH#${month}`,
            },
            UpdateExpression: `
            ADD totalAmount :negAmount,
                expenseCount :negOne
          `,
            ExpressionAttributeValues: {
              ":negAmount": -item.amount,
              ":negOne": -1,
            },
          },
        },

        {
          Update: {
            TableName: TABLE_NAME,
            Key: {
              PK: pk,
              SK: `CATEGORY#${item.categoryId}#${month}`,
            },
            UpdateExpression: `
            ADD totalAmount :negAmount,
                expenseCount :negOne
          `,
            ExpressionAttributeValues: {
              ":negAmount": -item.amount,
              ":negOne": -1,
            },
          },
        },
      ],
    }),
  );
}
