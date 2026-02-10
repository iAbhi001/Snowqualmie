import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

/**
 * 🔧 ULTRA-ROBUST ENVIRONMENT HELPER
 * This ensures variables are found whether Astro is building (meta.env)
 * or the Amplify SSR Node server is running (process.env).
 */
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

// Unified Credential Configuration
const commonCredentials = {
  accessKeyId: getEnv("APP_ACCESS_KEY_ID"),
  secretAccessKey: getEnv("APP_SECRET_ACCESS_KEY"),
};

// 📍 Region-Specific Configs
const ohioConfig = { region: "us-east-2", credentials: commonCredentials };
const virginiaConfig = { region: "us-east-1", credentials: commonCredentials };

// Initialize Regional Clients
const cwClient = new CloudWatchClient(virginiaConfig); // Metrics are Virginia-based
const ceClient = new CostExplorerClient(virginiaConfig); // Billing is us-east-1 ONLY
const dbClient = new DynamoDBClient(ohioConfig);       // Table is in Ohio
const s3Client = new S3Client(ohioConfig);             // Bucket is in Ohio

/**
 * 💰 TOTAL COST (Cost Explorer)
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
 */
export async function getLiveMetrics() {
  const appId = getEnv("APP_ID"); 
  if (!appId) {
    console.error("CRITICAL: APP_ID is missing from Environment Variables");
    return null;
  }

  try {
    const command = new GetMetricDataCommand({
      EndTime: new Date(),
      StartTime: new Date(Date.now() - 86400000), // Rolling 24h window
      MetricDataQueries: [
        {
          Id: "requests",
          MetricStat: {
            Metric: {
              Namespace: "AWS/AmplifyHosting",
              MetricName: "Requests",
              Dimensions: [{ Name: "App", Value: appId }] // Dimension must be 'App'
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
      errors: 0,
      status: "ONLINE"
    };
  } catch (err: any) {
    console.error(`AWS_CW_ERROR (${err.name}):`, err.message);
    return null;
  }
}

/**
 * 👥 VISITOR COUNT (DynamoDB)
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
 */
export async function getCapturedInterests() {
  const bucketName = getEnv("S3_PHOTO_BUCKET");
  if (!bucketName) return [];
  
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    return response.Contents
      .filter(item => item.Key && /\.(jpg|jpeg|png|webp)$/i.test(item.Key))
      .map(item => ({
        id: item.ETag,
        url: `https://${bucketName}.s3.us-east-2.amazonaws.com/${item.Key}`,
        title: item.Key?.split('/').pop()?.split('.')[0] || "Untitled"
      }));
  } catch (err) {
    console.error("AWS_S3_ERROR:", err);
    return [];
  }
}