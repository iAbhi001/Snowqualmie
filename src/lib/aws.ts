import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const client = new CloudWatchClient({ 
  region: "us-east-1", 
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  }
});

export async function getLiveMetrics() {
  const command = new GetMetricDataCommand({
    EndTime: new Date(),
    StartTime: new Date(Date.now() - 3600 * 1000), 
    MetricDataQueries: [
      {
        Id: "requests",
        MetricStat: {
          Metric: {
            Namespace: "AWS/AmplifyHosting",
            MetricName: "Requests",
            Dimensions: [{ Name: "App", Value: import.meta.env.AWS_APP_ID }]
          },
          Period: 3600,
          Stat: "Sum",
        },
      },
    ],
  });

  try {
    const response = await client.send(command);
    // Return the specific value or 0 if no data is found
    return response.MetricDataResults?.[0]?.Values?.[0] || 0;
  } catch (error) {
    console.error("AWS_SDK_ERROR:", error);
    return null;
  }
}