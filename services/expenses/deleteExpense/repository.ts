// services/expenses/deleteExpense/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!
if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set')
}

type DeleteExpenseParams = {
  userId: string
  expenseId: string
}

export async function deleteExpense({
  userId,
  expenseId
}: DeleteExpenseParams): Promise<void> {
  const pk = `USER#${userId}`

  // 1️⃣ Buscar el expense (para obtener el SK exacto)
  const query = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': `EXPENSE#`
      }
    })
  )

  const item = query.Items?.find(
    i => i.expenseId === expenseId
  )

  if (!item) {
    const error = new Error('Expense not found')
    ;(error as any).statusCode = 404
    throw error
  }

  // 2️⃣ Delete
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: pk,
        SK: item.SK
      }
    })
  )
}