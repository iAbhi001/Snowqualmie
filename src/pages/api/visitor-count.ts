import type { APIRoute } from 'astro';
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export const GET: APIRoute = async () => {
  // Use a fallback for both Local (import.meta) and Amplify (process.env)
  const accessKeyId = import.meta.env.APP_ACCESS_KEY_ID || process.env.APP_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.APP_SECRET_ACCESS_KEY || process.env.APP_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return new Response(JSON.stringify({ count: "000000", error: "Missing Credentials" }), { status: 200 });
  }

  const client = new DynamoDBClient({
    region: "us-east-1", // Ensure this matches your table region
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim()
    }
  });

  try {
    const command = new UpdateItemCommand({
      TableName: "VisitorStats", // Double check your table name here
      Key: { id: { S: "total_visitors" } },
      UpdateExpression: "ADD #c :inc",
      ExpressionAttributeNames: { "#c": "count" },
      ExpressionAttributeValues: { ":inc": { N: "1" } },
      ReturnValues: "UPDATED_NEW",
    });

    const response = await client.send(command);
    const count = response.Attributes?.count?.N || "0";

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ count: "0", error: error.message }), { status: 200 });
  }
};