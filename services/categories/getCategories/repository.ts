// services/categories/getCategories/repository.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

if (!TABLE_NAME) {
  throw new Error("TABLE_NAME environment variable is not set");
}

type GetCategoriesRepositoryParams = {
  userId: string;
  type?: "EXPENSE" | "INCOME";
};

export async function getCategories({
  userId,
  type,
}: GetCategoriesRepositoryParams): Promise<Record<string, unknown>[]> {
  const pk = `USER#${userId}`;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":sk": "CATEGORY#",
      },
    })
  );

  const items = (result.Items ?? [])
    .filter((item) => item.entityType === "CATEGORY")
    .filter((item) => !type || item.type === type);

  return items;
}
