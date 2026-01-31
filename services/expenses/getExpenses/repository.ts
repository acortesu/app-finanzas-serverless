// services/expenses/getExpenses/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
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