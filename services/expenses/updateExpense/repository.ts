import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME!

export class ExpenseNotFoundError extends Error {}

type UpdateExpenseParams = {
  userId: string
  expenseId: string
  updates: Record<string, unknown>
}

export async function updateExpense({
  userId,
  expenseId,
  updates
}: UpdateExpenseParams): Promise<void> {
  const pk = `USER#${userId}`
  const sk = `EXPENSE#${expenseId}`

  // 🔎 Verificar que existe
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk }
    })
  )

  if (!existing.Item) {
    throw new ExpenseNotFoundError('Expense not found')
  }

  // 🧩 Build UpdateExpression dinámico
  const expressions: string[] = []
  const values: Record<string, unknown> = {}
  const names: Record<string, string> = {}

  Object.entries(updates).forEach(([key, value]) => {
    expressions.push(`#${key} = :${key}`)
    values[`:${key}`] = value
    names[`#${key}`] = key
  })

  expressions.push('#updatedAt = :updatedAt')
  values[':updatedAt'] = new Date().toISOString()
  names['#updatedAt'] = 'updatedAt'

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