import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

const getEnv = (key: string) => import.meta.env[key] || process.env[key] || "";

const authConfig = {
  region: "us-east-1",
  credentials: {
    accessKeyId: getEnv("APP_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("APP_SECRET_ACCESS_KEY"),
  }
};

const cwClient = new CloudWatchClient(authConfig);
const dbClient = new DynamoDBClient(authConfig);

export async function getLiveMetrics() {
  const appId = getEnv("APP_ID");
  if (!appId) return { requests: 0, status: "OFFLINE" };
  try {
    const command = new GetMetricDataCommand({
      EndTime: new Date(),
      StartTime: new Date(Date.now() - 24 * 3600 * 1000),
      MetricDataQueries: [{
        Id: "requests",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "Requests",
            Dimensions: [{ Name: "App", Value: appId }]
          },
          Period: 3600,
          Stat: "Sum",
        },
      }],
    });
    const response = await cwClient.send(command);
    return { requests: response.MetricDataResults?.[0]?.Values?.[0] || 0, status: "ONLINE" };
  } catch { return { requests: 0, status: "OFFLINE" }; }
}

// 🚀 THIS WAS MISSING THE EXPORT KEYWORD
export async function getVisitorCount() {
  const tableName = "VisitorStats"; 
  try {
    await dbClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: { id: { S: "total_visitors" } },
      UpdateExpression: "ADD #c :val",
      ExpressionAttributeNames: { "#c": "count" },
      ExpressionAttributeValues: { ":val": { N: "1" } }
    }));
    const res = await dbClient.send(new GetItemCommand({
      TableName: tableName,
      Key: { id: { S: "total_visitors" } }
    }));
    return res.Item?.count?.N || "000000";
  } catch (err) {
    console.error("DynamoDB Error:", err);
    return "000000";
  }
}

export async function getMarketData(symbol: string = 'AAPL') {
  const key = getEnv("ALPHA_VANTAGE_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`);
    const data = await res.json();
    return data["Global Quote"] || null;
  } catch { return null; }
}

export async function getLatestNews() {
  const key = getEnv("GUARDIAN_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch(`https://content.guardianapis.com/search?section=technology&api-key=${key}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    return data.response?.results || [];
  } catch { return []; }
}

export async function getCapturedInterests() { return []; }