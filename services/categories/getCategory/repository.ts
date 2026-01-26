// services/categories/getCategory/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export class CategoryNotFoundError extends Error {
  readonly statusCode = 404

  constructor() {
    super('Category not found')
    this.name = 'CategoryNotFoundError'
  }
}

type GetCategoryRepositoryParams = {
  userId: string
  categoryId: string
}

export async function getCategory({
  userId,
  categoryId
}: GetCategoryRepositoryParams): Promise<Record<string, unknown>> {
  const pk = `USER#${userId}`

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'CATEGORY#'
      }
    })
  )

  const item = result.Items?.find(
    i =>
      i.entityType === 'CATEGORY' &&
      i.categoryId === categoryId
  )

  if (!item) {
    throw new CategoryNotFoundError()
  }

  return item
}