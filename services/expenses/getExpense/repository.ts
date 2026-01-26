// services/expenses/getExpense/repository.ts

import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export type ExpenseItem = {
  PK: string
  SK: string
  expenseId: string
  amount: number
  currency: string
  categoryId: string
  paymentMethod: string
  description?: string
  date: string
  createdAt: string
  updatedAt: string
}

/**
 * Obtiene un expense por userId + expenseId
 * Devuelve undefined si no existe
 */
export async function getExpenseById(
  userId: string,
  expenseId: string
): Promise<ExpenseItem | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `USER#${userId}`,
        SK: `EXPENSE#${expenseId}`
      }
    })
  )

  return result.Item as ExpenseItem | undefined
}