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
export async function getLiveMetrics() {
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
    const results = response.MetricDataResults;
    
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
  }
}