// services/expenses/deleteExpense/repository.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

export async function findExpenseById({
  userId,
  expenseId
}: {
  userId: string
  expenseId: string
}) {
  const pk = `USER#${userId}`
  const sk = `EXPENSE#${expenseId}`

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!result.Item || result.Item.isDeleted === true) {
    return undefined
  }

  return result.Item
}

export async function softDeleteExpense({
  userId,
  expenseId
}: {
  userId: string
  expenseId: string
}) {
  const pk = `USER#${userId}`
  const sk = `EXPENSE#${expenseId}`

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `
        SET isDeleted = :true,
            deletedAt = :now
      `,
      ExpressionAttributeValues: {
        ':true': true,
        ':now': new Date().toISOString()
      }
    })
  )
}

export async function findExpensesByMonth({
  userId,
  month
}: {
  userId: string
  month: string
}) {
  const pk = `USER#${userId}`

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'EXPENSE#'
      }
    })
  )

  return (result.Items ?? []).filter(
    item =>
      item.month === month &&
      item.isDeleted !== true
  )
}

export async function recalculateMonthAggregate({
  userId,
  month,
  expenses
}: {
  userId: string
  month: string
  expenses: any[]
}) {
  const pk = `USER#${userId}`

  const totalAmount = expenses.reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0
  )

  const expenseCount = expenses.length

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: pk,
        SK: `MONTH#${month}`
      },
      UpdateExpression: `
        SET totalAmount = :total,
            expenseCount = :count,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':total': totalAmount,
        ':count': expenseCount,
        ':now': new Date().toISOString()
      }
    })
  )
}

export async function recalculateCategoryAggregate({
  userId,
  categoryId,
  month,
  expenses
}: {
  userId: string
  categoryId: string
  month: string
  expenses: any[]
}) {
  const pk = `USER#${userId}`

  const totalAmount = expenses.reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0
  )

  const expenseCount = expenses.length

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: pk,
        SK: `CATEGORY#${categoryId}#${month}`
      },
      UpdateExpression: `
        SET totalAmount = :total,
            expenseCount = :count,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':total': totalAmount,
        ':count': expenseCount,
        ':now': new Date().toISOString()
      }
    })
  )
}


