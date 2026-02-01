import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

// 🔧 Helper to grab environment variables in Astro/Vite/Node
const getEnv = (key: string) => import.meta.env[key] || process.env[key] || "";

// 🛰️ GLOBAL AWS CONFIGURATION
const authConfig = {
  region: "us-east-2", // Billing/Cost metrics are usually in us-east-1
  credentials: {
    accessKeyId: getEnv("APP_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("APP_SECRET_ACCESS_KEY"),
  }
};

// Initialize Clients
const cwClient = new CloudWatchClient(authConfig);
const dbClient = new DynamoDBClient(authConfig);
const s3Client = new S3Client(authConfig);
const ceClient = new CostExplorerClient(authConfig);

/**
 * 💰 TOTAL COST (Cost Explorer)
 * Fetches the unblended cost from the start of the year to today.
 */
export async function getTotalCost() {
  try {
    const now = new Date();
    const startOfYear = `${now.getFullYear()}-01-01`;
    const today = now.toISOString().split('T')[0];

    const command = new GetCostAndUsageCommand({
      TimePeriod: { Start: startOfYear, End: today },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    });

    const data = await ceClient.send(command);
    
    // Sum the "Amount" field from all results in the time range
    const total = data.ResultsByTime?.reduce((acc, month) => {
      return acc + parseFloat(month.Total?.UnblendedCost?.Amount || "0");
    }, 0);

    return total?.toFixed(2) || "0.00";
  } catch (err) {
    console.error("AWS_COST_ERROR:", err);
    return "0.00";
  }
}

/**
 * 🛰️ LIVE TELEMETRY (CloudWatch)
 * Pulls real-time request counts and egress data.
 */
export async function getLiveMetrics() {
  const appId = getEnv("APP_ID"); // Your Amplify or CloudFront App ID
  if (!appId) return null;

  try {
    const command = new GetMetricDataCommand({
      EndTime: new Date(),
      StartTime: new Date(Date.now() - 86400000), // Last 24 Hours
      MetricDataQueries: [
        {
          Id: "requests",
          MetricStat: {
            Metric: {
              Namespace: "AWS/AmplifyHosting",
              MetricName: "Requests",
              Dimensions: [{ Name: "App", Value: appId }]
            },
            Period: 86400,
            Stat: "Sum",
          },
        },
        {
          Id: "egress",
          MetricStat: {
            Metric: {
              Namespace: "AWS/AmplifyHosting",
              MetricName: "BytesOut",
              Dimensions: [{ Name: "App", Value: appId }]
            },
            Period: 86400,
            Stat: "Sum",
          },
        }
      ],
    });

    const res = await cwClient.send(command);
    
    return {
      requests: res.MetricDataResults?.[0]?.Values?.[0] || 0,
      egress: res.MetricDataResults?.[1]?.Values?.[0] || 0,
      errors: 0, // You can add a 4XX/5XX metric query here similarly
      status: "ONLINE"
    };
  } catch (err) {
    console.error("AWS_CLOUDWATCH_ERROR:", err);
    return null;
  }
}

/**
 * 👥 VISITOR COUNT (DynamoDB)
 * Increments and retrieves a global counter.
 */
export async function getVisitorCount(shouldIncrement = false) {
  const tableName = "SiteMetrics"; 
  const key = { metric_id: { S: "total_visitors" } };

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

    const res = await dbClient.send(new GetItemCommand({ TableName: tableName, Key: key }));
    return res.Item?.count?.N || "000000";
  } catch (err) {
    console.error("AWS_DYNAMODB_ERROR:", err);
    return "000000";
  }
}

/**
 * 📸 PHOTOGRAPHY GALLERY (S3)
 * Maps S3 objects to public URLs.
 */
export async function getCapturedInterests() {
  const bucketName = getEnv("S3_PHOTO_BUCKET");
  
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3Client.send(command);

    if (!response.Contents) return [];

    return response.Contents
      .filter(item => item.Key && /\.(jpg|jpeg|png|webp)$/i.test(item.Key))
      .map(item => ({
        id: item.ETag,
        url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
        title: item.Key?.split('/').pop()?.split('.')[0] || "Untitled"
      }));
  } catch (err) {
    console.error("AWS_S3_ERROR:", err);
    return [];
  }
}