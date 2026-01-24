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
  const skExpense = `EXPENSE#${input.date}#${expenseId}`

  const month = input.date.slice(0, 7) // YYYY-MM
  const now = new Date().toISOString()

  const expenseItem = {
    PK: pk,
    SK: skExpense,
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
      {
        Put: {
          TableName: TABLE_NAME,
          Item: expenseItem
        }
      },
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
      {
        Update: {
          TableName: TABLE_NAME,
          Key: categoryAggregateKey,
          UpdateExpression: `
            ADD totalAmount :amount,
                expenseCount :one
          `,
          ExpressionAttributeValues: {
            ':amount': input.amount,
            ':one': 1
          }
        }
      }
    ]
  })

  await ddb.send(command)

  return { expenseId }
}