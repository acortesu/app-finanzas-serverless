// services/categories/createCategory/repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export class CategoryAlreadyExistsError extends Error {}

type CreateCategoryParams = {
  userId: string
  name: string
  color: string
  type: 'EXPENSE' | 'INCOME'
}

export async function createCategory({
  userId,
  name,
  color,
  type
}: CreateCategoryParams): Promise<{ categoryId: string }> {
  const pk = `USER#${userId}`

  // 🔎 Buscar si ya existe categoría con mismo name + type
  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'CATEGORY#'
      }
    })
  )

  const match = (existing.Items ?? []).find(
    (item: any) =>
      item.entityType === 'CATEGORY' &&
      item.name === name &&
      item.type === type
  )

  // ♻️ RESTORE automático
  if (match) {
    if (!match.isDeleted) {
      throw new CategoryAlreadyExistsError('Category already exists')
    }

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: match.SK },
        UpdateExpression: `
          SET isDeleted = :false,
              deletedAt = :null,
              color = :color,
              updatedAt = :now
        `,
        ExpressionAttributeValues: {
          ':false': false,
          ':null': null,
          ':color': color,
          ':now': new Date().toISOString()
        }
      })
    )

    return { categoryId: match.categoryId }
  }

  // 🆕 Crear nueva
  const categoryId = randomUUID()
  const now = new Date().toISOString()

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: pk,
        SK: `CATEGORY#${categoryId}`,
        entityType: 'CATEGORY',
        categoryId,
        name,
        color,
        type,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      }
    })
  )

  return { categoryId }
}