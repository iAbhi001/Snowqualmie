import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * 1. UPDATED CLIENT CONFIGURATION
 * We use an 'APP_' prefix because 'AWS_' is reserved by Amplify Hosting 
 * and cannot be used for custom environment variables.
 */
const authConfig = {
  region: "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.APP_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.APP_SECRET_ACCESS_KEY,
  }
};

const client = new CloudWatchClient(authConfig);
const s3Client = new S3Client(authConfig);

/**
 * 2. CLOUDWATCH TELEMETRY
 * Fetches site metrics for your Fiscal Maintenance dashboard.
 */
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Standardize configuration
const region = "us-east-1";
const authConfig = {
  region: region,
  credentials: {
    accessKeyId: import.meta.env.APP_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.APP_SECRET_ACCESS_KEY,
  }
};

const cwClient = new CloudWatchClient(authConfig);
const s3Client = new S3Client(authConfig);

/**
 * 1. LIVE METRICS LOGIC
 * Fetches Requests and Egress data from CloudWatch
 */
export async function getLiveMetrics() {
  const appId = import.meta.env.APP_ID;
  
  // Debug for Amplify Logs
  console.log("--- 🕵️ AWS METRICS DEBUG ---");
  console.log("App ID:", appId ? "FOUND" : "MISSING ❌");

  if (!appId || !import.meta.env.APP_ACCESS_KEY_ID) {
    return { requests: 0, egress: 0, errors: 0, status: "OFFLINE" };
  }

  const endTime = new Date();
  const startTime = new Date(Date.now() - 24 * 3600 * 1000);

  const command = new GetMetricDataCommand({
    EndTime: endTime,
    StartTime: startTime,
    MetricDataQueries: [
      {
        Id: "requests",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "Requests",
            // APP_ID is the unique ID of your Amplify project
            Dimensions: [{ Name: "App", Value: import.meta.env.APP_ID }]
          },
          Period: 86400,
          Period: 60, // High granularity for real-time feel
          Stat: "Sum",
        },
      },
      {
        Id: "bytesOut",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "BytesOut",
            Dimensions: [{ Name: "App", Value: import.meta.env.APP_ID }]
          },
          Period: 86400,
          Stat: "Sum",
        },
      },
      {
        Id: "errors",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "5XXErrors",
            Dimensions: [{ Name: "App", Value: import.meta.env.APP_ID }]
          },
          Period: 86400,
          Stat: "Sum",
        },
      }
    ],
  });

  try {
    const response = await client.send(command);
    const response = await cwClient.send(command);
    const results = response.MetricDataResults;
    
    const reqData = results?.find(r => r.Id === "requests")?.Values?.[0] ?? 0;
    const egressData = results?.find(r => r.Id === "egress")?.Values?.[0] ?? 0;

    return {
      requests: results?.find(r => r.Id === "requests")?.Values?.[0] || 0,
      egress: results?.find(r => r.Id === "bytesOut")?.Values?.[0] || 0,
      errors: results?.find(r => r.Id === "errors")?.Values?.[0] || 0,
    };
  } catch (error) {
    console.error("AWS_SDK_ERROR:", error);
    return null;
  }
}

/**
 * 3. S3 DISCOVERY LOGIC
 * Automatically lists photos from your specific S3 bucket sub-folder.
 */
export async function getCapturedInterests() {
  const bucketName = import.meta.env.APP_S3_BUCKET; 
  const prefix = "captured-interests/"; 

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });

  try {
    const data = await s3Client.send(command);
    
    // Filter out the prefix itself and map to the gallery format
    return data.Contents?.filter(item => item.Key !== prefix).map((item, index) => ({
      id: index,
      name: item.Key?.replace(prefix, "") || "", 
      url: `https://${bucketName}.s3.amazonaws.com/${item.Key}`,
      lastModified: item.LastModified
    })) || [];
  } catch (error) {
    console.error("S3_DISCOVERY_ERROR:", error);
    return [];
  } catch (error: any) {
    console.error("❌ CLOUDWATCH_ERROR:", error.name);
    return { requests: 0, egress: 0, errors: 0, status: "OFFLINE" };
  }
}

/**
 * 2. PHOTOGRAPHY LOGIC (Fixes the Build Error)
 * Fetches images from your S3 bucket
 */
export async function getCapturedInterests() {
  const bucketName = import.meta.env.APP_S3_BUCKET;
  const prefix = "captured-interests/";

  if (!bucketName) {
    console.error("❌ S3_ERROR: Bucket name missing in ENV");
    return [];
  }

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });

  try {
    const data = await s3Client.send(command);
    
    // Filter out the folder itself and map to a clean format
    return data.Contents?.filter(item => item.Key !== prefix).map((item, index) => ({
      id: index,
      name: item.Key?.replace(prefix, "") || "Untitled", 
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${item.Key}`,
      lastModified: item.LastModified
    })) || [];
  } catch (error: any) {
    console.error("❌ S3_DISCOVERY_ERROR:", error.name);
    return [];
  }
}