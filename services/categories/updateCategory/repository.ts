// services/categories/updateCategory/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export class CategoryNotFoundError extends Error {}

type UpdateCategoryParams = {
  userId: string
  categoryId: string
  updates: {
    name?: string
    color?: string
  }
}

export async function updateCategory({
  userId,
  categoryId,
  updates
}: UpdateCategoryParams): Promise<void> {
  const pk = `USER#${userId}`
  const sk = `CATEGORY#${categoryId}`

  // 🔎 Verificar existencia
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!existing.Item) {
    throw new CategoryNotFoundError('Category not found')
  }

  const expressions: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (updates.name) {
    expressions.push('#name = :name')
    names['#name'] = 'name'
    values[':name'] = updates.name
  }

  if (updates.color) {
    expressions.push('#color = :color')
    names['#color'] = 'color'
    values[':color'] = updates.color
  }

  expressions.push('#updatedAt = :updatedAt')
  names['#updatedAt'] = 'updatedAt'
  values[':updatedAt'] = new Date().toISOString()

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values
    })
  )
}