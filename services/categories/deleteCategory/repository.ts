// services/categories/deleteCategory/repository.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export class CategoryNotFoundError extends Error {}

/* -------------------------------------------------------------------------- */
/*                                FIND EXPENSES                               */
/* -------------------------------------------------------------------------- */

type FindExpensesParams = {
  userId: string;
  categoryId: string;
};

export async function findExpensesByCategory({
  userId,
  categoryId,
}: FindExpensesParams): Promise<any[]> {
  const pk = `USER#${userId}`;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":sk": "EXPENSE#",
      },
    }),
  );
  console.log("[DEBUG][findExpensesByCategory] raw items:", result.Items);

  const filtered = (result.Items ?? []).filter(
    (item) => item.categoryId === categoryId && item.isDeleted !== true,
  );

  console.log("[DEBUG][findExpensesByCategory] categoryId:", categoryId);
  console.log("[DEBUG][findExpensesByCategory] filtered items:", filtered);

  return filtered.map((item) => ({
    ...item,
    month: item.month,
  }));
}

/* -------------------------------------------------------------------------- */
/*                             SOFT DELETE EXPENSES                            */
/* -------------------------------------------------------------------------- */

type SoftDeleteExpensesParams = {
  userId: string;
  expenses: any[];
};

export async function softDeleteExpenses({
  userId,
  expenses,
}: SoftDeleteExpensesParams): Promise<void> {
  console.log("[DEBUG][softDeleteExpenses] expenses to delete:", expenses);
  if (expenses.length === 0) return;

  const pk = `USER#${userId}`;
  const now = new Date().toISOString();

  // DynamoDB TransactWrite límite: 25
  const chunks = [];
  for (let i = 0; i < expenses.length; i += 25) {
    chunks.push(expenses.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const transactItems = chunk.map((expense) => ({
      Update: {
        TableName: TABLE_NAME,
        Key: {
          PK: pk,
          SK: expense.SK,
        },
        UpdateExpression: `
          SET isDeleted = :true,
              deletedAt = :now
        `,
        ExpressionAttributeValues: {
          ":true": true,
          ":now": now,
        },
      },
    }));

    await ddb.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                             SOFT DELETE CATEGORY                            */
/* -------------------------------------------------------------------------- */

type SoftDeleteCategoryParams = {
  userId: string;
  categoryId: string;
};

export async function softDeleteCategory({
  userId,
  categoryId,
}: SoftDeleteCategoryParams): Promise<void> {
  const pk = `USER#${userId}`;
  const sk = `CATEGORY#${categoryId}`;
  const now = new Date().toISOString();

  // 🔎 Verificar existencia
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    }),
  );
  console.log(
    "[DEBUG][softDeleteCategory] existing category item:",
    existing.Item,
  );

  if (!existing.Item || existing.Item.isDeleted === true) {
    throw new CategoryNotFoundError("Category not found");
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `
        SET isDeleted = :true,
            deletedAt = :now
      `,
      ExpressionAttributeValues: {
        ":true": true,
        ":now": now,
      },
    }),
  );
}

/* -------------------------------------------------------------------------- */
/*                Recalculate Ammount after soft delete                       */
/* -------------------------------------------------------------------------- */

type RecalculateCategoryAggregatesParams = {
  userId: string;
  categoryId: string;
  months: string[]; // ['2026-01', '2026-02']
};

export async function recalculateCategoryAggregates({
  userId,
  categoryId,
  months,
}: RecalculateCategoryAggregatesParams): Promise<void> {
  const pk = `USER#${userId}`;

  for (const month of months) {
    // 1️⃣ Buscar expenses NO borrados de esa categoría + mes
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": pk,
          ":sk": "EXPENSE#",
        },
      }),
    );

    const activeExpenses = (result.Items ?? []).filter(
      (item) =>
        item.categoryId === categoryId &&
        item.month === month &&
        item.isDeleted !== true,
    );

    const totalAmount = activeExpenses.reduce(
      (sum, e) => sum + Number(e.amount ?? 0),
      0,
    );

    const expenseCount = activeExpenses.length;

    // 2️⃣ Actualizar aggregate
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: pk,
          SK: `CATEGORY#${categoryId}#${month}`,
        },
        UpdateExpression: `
          SET totalAmount = :total,
              expenseCount = :count,
              updatedAt = :now
        `,
        ExpressionAttributeValues: {
          ":total": totalAmount,
          ":count": expenseCount,
          ":now": new Date().toISOString(),
        },
      }),
    );
  }
}

type RecalculateMonthAggregatesParams = {
  userId: string
  months: string[]
}

export async function recalculateMonthAggregates({
  userId,
  months
}: RecalculateMonthAggregatesParams): Promise<void> {
  const pk = `USER#${userId}`

  for (const month of months) {
    // Buscar expenses activos del mes
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

    const activeExpenses = (result.Items ?? []).filter(
      item => item.month === month && item.isDeleted !== true
    )

    const totalAmount = activeExpenses.reduce(
      (sum, e) => sum + Number(e.amount ?? 0),
      0
    )

    const expenseCount = activeExpenses.length

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
}
