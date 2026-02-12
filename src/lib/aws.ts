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
/**
 * 📸 PHOTOGRAPHY GALLERY (S3)
 * Fetches objects from S3, sorts them by date, and formats for the UI.
 */
/**
 * 📸 PHOTOGRAPHY GALLERY (S3)
 * Optimized for the "captured-interests/" directory.
 */
export async function getCapturedInterests() {
  // 1. Clean the Environment Variables (Removes accidental spaces/slashes)
  const rawBucket = getEnv("S3_PHOTO_BUCKET");
  const bucketName = rawBucket?.trim().replace(/\/$/, ""); 
  const region = "us-east-2"; 
  
  // 🎯 Folder name must match S3 EXACTLY (Case Sensitive)
  const folderPrefix = "captured-interests/"; 
  
  if (!bucketName) {
    console.error("❌ Environment Error: S3_PHOTO_BUCKET is not defined.");
    return [];
  }
  
  try {
    const command = new ListObjectsV2Command({ 
      Bucket: bucketName,
      Prefix: folderPrefix, // Look inside the folder
    });

    console.log(`📡 Fetching from: ${bucketName}/${folderPrefix}`);
    const response = await s3Client.send(command);
    
    // Check if S3 actually returned anything
    if (!response.Contents || response.Contents.length === 0) {
      console.warn(`⚠️ S3 returned 0 objects for prefix: ${folderPrefix}`);
      return [];
    }

    const filteredPhotos = response.Contents
      .filter(item => {
        const key = item.Key || "";
        // Skip the folder itself (which is returned as an object of size 0)
        if (key === folderPrefix) return false;
        // Match common image extensions
        return /\.(jpg|jpeg|png|webp|avif)$/i.test(key);
      })
      .sort((a, b) => {
        // Sort by upload date (Newest First)
        return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0);
      })
      .map(item => {
        const key = item.Key!;
        const fileName = key.split('/').pop() || "";
        
        // Clean up title for the UI
        const cleanTitle = fileName
          .split('.')[0]
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        return {
          id: item.ETag?.replace(/"/g, '') || Math.random().toString(36),
          // Ensure URL is correctly formatted
          url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
          title: cleanTitle,
          lastModified: item.LastModified
        };
      });

    console.log(`✅ Success: Formatted ${filteredPhotos.length} photos.`);
    return filteredPhotos;

  } catch (err: any) {
    console.error("❌ AWS S3 Error:", err.message);
    return [];
  }
}