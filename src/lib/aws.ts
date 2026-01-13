// src/lib/aws.ts
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const client = new CloudWatchClient({ 
  region: "us-east-1", // Your AWS Region
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  }
});

export async function getLiveMetrics() {
  const command = new GetMetricDataCommand({
    EndTime: new Date(),
    StartTime: new Date(Date.now() - 3600 * 1000), // Last 1 hour
    MetricDataQueries: [
      {
        Id: "requests",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "Requests",
            Dimensions: [{ Name: "App", Value: "YOUR_APP_ID" }]
          },
          Period: 3600,
          Stat: "Sum",
        },
      },
      // Add more queries for BytesDownloaded, 4xxErrors, etc.
    ],
  });

  const response = await client.send(command);
  return response.MetricDataResults;
}