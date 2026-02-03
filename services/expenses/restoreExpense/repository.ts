// services/expenses/restoreExpense/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export async function restoreExpense({
  userId,
  expenseId
}: {
  userId: string
  expenseId: string
}) {
  const pk = `USER#${userId}`
  const sk = `EXPENSE#${expenseId}`

  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!existing.Item) {
    return undefined
  }

  // ⚠️ NO lanzar error aquí
  if (existing.Item.isDeleted !== true) {
    return existing.Item
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `
        REMOVE deletedAt
        SET isDeleted = :false
      `,
      ExpressionAttributeValues: {
        ':false': false
      }
    })
  )

  return existing.Item
}