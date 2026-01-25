// services/expenses/createExpense/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { CreateExpenseInput } from './schema'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set')
}

type CreateExpenseParams = {
  userId: string
  input: CreateExpenseInput
}

export async function createExpense({
  userId,
  input
}: CreateExpenseParams): Promise<{ expenseId: string }> {
  const expenseId = randomUUID()

  const pk = `USER#${userId}`

  // ✅ SK CANÓNICO DEL EXPENSE (clave directa por ID)
  const expenseSk = `EXPENSE#${expenseId}`

  const month = input.date.slice(0, 7) // YYYY-MM
  const now = new Date().toISOString()

  const expenseItem = {
    PK: pk,
    SK: expenseSk,
    entityType: 'EXPENSE',

    expenseId,
    userId,

    amount: input.amount,
    currency: input.currency,
    categoryId: input.categoryId,
    description: input.description,
    paymentMethod: input.paymentMethod,
    tags: input.tags,

    date: input.date,
    month, // útil para filtros
    createdAt: now
  }

  const monthlyAggregateKey = {
    PK: pk,
    SK: `MONTH#${month}`
  }

  const categoryAggregateKey = {
    PK: pk,
    SK: `CATEGORY#${input.categoryId}#${month}`
  }

  const command = new TransactWriteCommand({
    TransactItems: [
      // 1️⃣ Expense
      {
        Put: {
          TableName: TABLE_NAME,
          Item: expenseItem
        }
      },

      // 2️⃣ Aggregate mensual
      {
        Update: {
          TableName: TABLE_NAME,
          Key: monthlyAggregateKey,
          UpdateExpression: `
            ADD totalAmount :amount,
                expenseCount :one
            SET updatedAt = :now,
                currency = if_not_exists(currency, :currency)
          `,
          ExpressionAttributeValues: {
            ':amount': input.amount,
            ':one': 1,
            ':now': now,
            ':currency': input.currency
          }
        }
      },

      // 3️⃣ Aggregate por categoría + mes
      {
        Update: {
          TableName: TABLE_NAME,
          Key: categoryAggregateKey,
          UpdateExpression: `
            ADD totalAmount :amount,
                expenseCount :one
            SET updatedAt = :now
          `,
          ExpressionAttributeValues: {
            ':amount': input.amount,
            ':one': 1,
            ':now': now
          }
        }
      }
    ]
  })

  await ddb.send(command)

  return { expenseId }
}