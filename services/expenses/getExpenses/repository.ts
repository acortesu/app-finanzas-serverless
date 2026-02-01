// services/expenses/getExpenses/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set')
}

type GetExpensesRepositoryParams = {
  userId: string
  limit: number
  cursor?: string
}

export async function getExpenses({
  userId,
  limit,
  cursor
}: GetExpensesRepositoryParams): Promise<{
  items: Record<string, unknown>[]
  nextCursor?: string
}> {
  const pk = `USER#${userId}`

  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression:
      'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':skPrefix': 'EXPENSE#'
    },
    Limit: limit,
    ScanIndexForward: false // newest first
  }

  // Pagination
  if (cursor) {
    params.ExclusiveStartKey = JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf-8')
    )
  }

  const result = await ddb.send(new QueryCommand(params))

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString('base64')
    : undefined

  const items = (result.Items ?? [])
  .filter(item => item.entityType === 'EXPENSE')
  .filter(item => item.isDeleted !== true)

  return {
    items,
    nextCursor
  }
}

type GetExpensesAggregatesParams = {
  userId: string
  month: string // YYYY-MM
}

export async function getExpensesAggregates({
  userId,
  month
}: GetExpensesAggregatesParams): Promise<{
  totalAmount: number
  expenseCount: number
}> {
  const pk = `USER#${userId}`
  const sk = `MONTH#${month}`

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!result.Item) {
    return {
      totalAmount: 0,
      expenseCount: 0
    }
  }

  return {
    totalAmount: Number(result.Item.totalAmount ?? 0),
    expenseCount: Number(result.Item.expenseCount ?? 0)
  }
}