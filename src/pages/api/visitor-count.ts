import type { APIRoute } from 'astro';
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';
import path from 'path';
import type { ProcessEnv } from 'node';


dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const GET: APIRoute = async () => {
  // Now check the keys from process.env specifically
  const accessKeyId = process.env.APP_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error("❌ CRITICAL: Even with manual loading, .env is not found at:", path.resolve(process.cwd(), '.env'));
    return new Response(JSON.stringify({ count: "000000" }), { status: 200 });
  }

  const client = new DynamoDBClient({
    region: "us-east-2",
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim()
    }
  });

  try {
    const command = new UpdateItemCommand({
      TableName: "SiteMetrics",
      Key: { metric_id: { S: "total_visitors" } },
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
    console.error("AWS_DYNAMO_ERROR:", error.name, error.message);
    return new Response(JSON.stringify({ count: "0", error: error.message }), { status: 200 });
  }
};