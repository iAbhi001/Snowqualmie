import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

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
  const startTime = new Date(Date.now() - 48 * 3600 * 1000); 

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
            Dimensions: [{ Name: "App", Value: appId }]
          },
          Period: 60, // 24 hour chunks
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

  try {
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
      requests: reqData,
      egress: egressData,
      errors: 0,
      status: "ONLINE"
    };
  } catch (error: any) {
    // DEBUG 3: Specific Error Type Check
    console.error("❌ AWS_SDK_CRITICAL_ERROR:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    return { requests: 0, egress: 0, errors: 0, status: "OFFLINE" };
  }
}