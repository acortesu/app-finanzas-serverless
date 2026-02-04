import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export async function restoreCategory({
  userId,
  categoryId
}: {
  userId: string
  categoryId: string
}) {
  const pk = `USER#${userId}`
  const sk = `CATEGORY#${categoryId}`

  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!existing.Item) {
    return undefined
  }

  if (existing.Item.isDeleted !== true) {
    return existing.Item
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `
        REMOVE deletedAt
        SET isDeleted = :false
      `,
      ExpressionAttributeValues: {
        ':false': false
      }
    })
  )

  return {
    ...existing.Item,
    isDeleted: false
  }
}