import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

<<<<<<< HEAD
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
=======
>>>>>>> parent of 6da4578 (Fixed /photography error and move noise.svg)
export async function getLiveMetrics() {
  const appId = import.meta.env.APP_ID;
  const accessKey = import.meta.env.APP_ACCESS_KEY_ID;
  const region = "us-east-1";

  // DEBUG 1: Environment Variable Check
  console.log("--- 🕵️ AWS DEBUG START ---");
  console.log("Target Region:", region);
  console.log("Target App ID:", appId ? "FOUND" : "MISSING ❌");
  console.log("Access Key ID:", accessKey ? "FOUND" : "MISSING ❌");

  if (!appId || !accessKey) {
    return { requests: 0, egress: 0, errors: 0, status: "OFFLINE" };
  }

  const cwClient = new CloudWatchClient({
    region: region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: import.meta.env.APP_SECRET_ACCESS_KEY,
    }
  });

  // We broaden the window to 48 hours to ensure we aren't just missing the "aggregation delay"
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
<<<<<<< HEAD
          Period: 86400,
          Period: 60, // High granularity for real-time feel
=======
          Period: 60, // 24 hour chunks
>>>>>>> parent of 6da4578 (Fixed /photography error and move noise.svg)
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
    
    // DEBUG 2: Raw Response Inspection
    console.log("RAW_METRIC_DATA_RESULTS:");
    console.dir(response.MetricDataResults, { depth: null });

    const results = response.MetricDataResults;
    
    const reqData = results?.find(r => r.Id === "requests")?.Values?.[0] ?? 0;
    const egressData = results?.find(r => r.Id === "egress")?.Values?.[0] ?? 0;

    console.log(`PARSED: Requests: ${reqData}, Egress: ${egressData}`);
    console.log("--- 🕵️ AWS DEBUG END ---");

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
    // DEBUG 3: Specific Error Type Check
    console.error("❌ AWS_SDK_CRITICAL_ERROR:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    return { requests: 0, egress: 0, errors: 0, status: "OFFLINE" };
  }
}