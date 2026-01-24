// services/expenses/getExpenses/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'

import { GetExpensesQuery } from './schema'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set')
}

type GetExpensesRepositoryParams = {
  userId: string
  query: GetExpensesQuery
}

export async function getExpenses({
  userId,
  query
}: GetExpensesRepositoryParams): Promise<{
  items: Record<string, unknown>[]
  nextCursor?: string
}> {
  const pk = `USER#${userId}`

  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': pk
    },
    Limit: query.limit,
    ScanIndexForward: false // newest first
  }

  // Cursor (pagination)
  if (query.cursor) {
    params.ExclusiveStartKey = JSON.parse(
      Buffer.from(query.cursor, 'base64').toString('utf-8')
    )
  }

  // MONTH mode
  if (query.type === 'MONTH') {
    params.KeyConditionExpression +=
      ' AND begins_with(SK, :skPrefix)'
    params.ExpressionAttributeValues[':skPrefix'] =
      `EXPENSE#${query.month}`
  }

  // RANGE mode
  if (query.type === 'RANGE') {
    params.KeyConditionExpression +=
      ' AND SK BETWEEN :from AND :to'

    params.ExpressionAttributeValues[':from'] =
      `EXPENSE#${query.from}`

    params.ExpressionAttributeValues[':to'] =
      `EXPENSE#${query.to}\uffff`
  }

  const result = await ddb.send(new QueryCommand(params))

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString('base64')
    : undefined

  return {
    items: result.Items ?? [],
    nextCursor
  }
}