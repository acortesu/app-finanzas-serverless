// services/categories/deleteCategory/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export class CategoryNotFoundError extends Error {}

type DeleteCategoryParams = {
  userId: string
  categoryId: string
}

export async function deleteCategory({
  userId,
  categoryId
}: DeleteCategoryParams): Promise<void> {
  const pk = `USER#${userId}`
  const sk = `CATEGORY#${categoryId}`

  // 🔎 Verificar que existe y no esté borrada
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!existing.Item || existing.Item.isDeleted) {
    throw new CategoryNotFoundError('Category not found')
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `
        SET isDeleted = :true,
            deletedAt = :now
      `,
      ExpressionAttributeValues: {
        ':true': true,
        ':now': new Date().toISOString()
      }
    })
  )
}