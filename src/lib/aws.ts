import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const getEnv = (key: string) => import.meta.env[key] || process.env[key] || "";

// 🛰️ GLOBAL AWS CONFIGURATION
const authConfig = {
  region: "us-east-2",
  credentials: {
    accessKeyId: getEnv("APP_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("APP_SECRET_ACCESS_KEY"),
  }
};

const cwClient = new CloudWatchClient(authConfig);
const dbClient = new DynamoDBClient(authConfig);
const s3Client = new S3Client(authConfig);

/**
 * 🛰️ UPLINK STATUS (CloudWatch)
 * Verifies if the AWS connection is alive.
 */
export async function getLiveMetrics() {
  const appId = getEnv("APP_ID");
  if (!appId) return { status: "OFFLINE", requests: 0 };

  try {
    const command = new GetMetricDataCommand({
      EndTime: new Date(),
      StartTime: new Date(Date.now() - 600000), // Check last 10 mins
      MetricDataQueries: [{
        Id: "health",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "Requests",
            Dimensions: [{ Name: "App", Value: appId }]
          },
          Period: 60,
          Stat: "Sum",
        },
      }],
    });

    await cwClient.send(command);
    return { status: "ONLINE", requests: 0 };
  } catch (err) {
    return { status: "OFFLINE", requests: 0 };
  }
}

/**
 * 👥 VISITOR COUNT (DynamoDB)
 * Interacts with 'SiteMetrics' table using 'metric_id'.
 */
export async function getVisitorCount(shouldIncrement = false) {
  const tableName = "SiteMetrics"; 
  const key = { metric_id: { S: "total_visitors" } }; // Match your table exactly

  try {
    if (shouldIncrement) {
      await dbClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "ADD #c :val",
        ExpressionAttributeNames: { "#c": "count" },
        ExpressionAttributeValues: { ":val": { N: "1" } }
      }));
    }

    const res = await dbClient.send(new GetItemCommand({
      TableName: tableName,
      Key: key
    }));

    // Ensure we return a string for the frontend padding
    return res.Item?.count?.N || "000000";
  } catch (err) {
    console.error("DynamoDB Sync Error:", err);
    return "000000";
  }
}

/**
 * 📸 PHOTOGRAPHY GALLERY (S3)
 * Fetches images from your S3 bucket for the Photography page.
 */
export async function getCapturedInterests() {
  const bucketName = "your-photography-bucket-name"; // 🚨 REPLACE THIS WITH YOUR ACTUAL BUCKET NAME
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      // If your photos are in a specific folder, add Prefix: "folder-name/",
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    // Map S3 objects to public URLs
    return response.Contents
      .filter(item => item.Key && /\.(jpg|jpeg|png|webp)$/i.test(item.Key))
      .map(item => ({
        id: item.ETag,
        url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
        title: item.Key?.split('/').pop()?.split('.')[0] || "Untitled Capture"
      }));

  } catch (err) {
    console.error("S3 Data Fetch Failed:", err);
    return []; // Return empty array to prevent page crash
  }
}

/**
 * 📈 MARKET DATA (REMOVED)
 * Function kept as placeholder to avoid import errors in other files
 */
export async function getMarketData() { return null; }

/**
 * 📰 NEWS FEED (REMOVED)
 * Function kept as placeholder to avoid import errors in other files
 */
export async function getLatestNews() { return []; }