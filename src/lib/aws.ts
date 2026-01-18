import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const getEnv = (key: string) => import.meta.env[key] || process.env[key] || "";

const authConfig = {
  region: "us-east-1",
  credentials: {
    accessKeyId: getEnv("APP_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("APP_SECRET_ACCESS_KEY"),
  }
};

const cwClient = new CloudWatchClient(authConfig);
const s3Client = new S3Client(authConfig);

export async function getLiveMetrics() {
  const appId = getEnv("APP_ID");
  if (!appId || !authConfig.credentials.accessKeyId) return { requests: 0, status: "OFFLINE" };

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

  try {
    const response = await cwClient.send(command);
    return { requests: response.MetricDataResults?.[0]?.Values?.[0] || 0, status: "ONLINE" };
  } catch { return { requests: 0, status: "OFFLINE" }; }
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    return data.response?.results || [];
  } catch { return []; }
}

export async function getCapturedInterests() {
  const bucketName = getEnv("APP_S3_BUCKET");
  if (!bucketName) return [];
  try {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: "captured-interests/" }));
    return data.Contents?.map((item, i) => ({ id: i, url: `https://${bucketName}.s3.amazonaws.com/${item.Key}` })) || [];
  } catch { return []; }
}