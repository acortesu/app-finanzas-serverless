// services/categories/createCategory/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { CreateCategoryInput } from './schema'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set')
}

export class CategoryAlreadyExistsError extends Error {}

type CreateCategoryParams = {
  userId: string
  input: CreateCategoryInput
}

export async function createCategory({
  userId,
  input
}: CreateCategoryParams): Promise<{ categoryId: string }> {
  const pk = `USER#${userId}`

  // 🔍 Evitar duplicados por nombre + tipo
  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression:
        'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'CATEGORY#'
      }
    })
  )

  const duplicate = existing.Items?.find(
    item =>
      item.name === input.name &&
      item.type === input.type
  )

  if (duplicate) {
    throw new CategoryAlreadyExistsError(
      'Category already exists'
    )
  }

  const categoryId = randomUUID()
  const now = new Date().toISOString()

  const item = {
    PK: pk,
    SK: `CATEGORY#${categoryId}`,
    entityType: 'CATEGORY',
    categoryId,
    name: input.name,
    type: input.type,
    createdAt: now
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    })
  )

  return { categoryId }
}