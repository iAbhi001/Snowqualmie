import type { APIRoute } from 'astro';
import { getLiveMetrics } from '../../lib/aws';

export const GET: APIRoute = async () => {
  try {
    const aws = await getLiveMetrics();
    
    // 🔍 THE FIX: Handle the case where aws is null
    if (!aws) {
      return new Response(JSON.stringify({
        aws: { status: "OFFLINE", requests: 0, message: "AWS_FETCH_FAILED" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      aws: {
        status: aws.status || "ONLINE",
        requests: aws.requests || 0,
        egress: aws.egress || 0
      }
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache" 
      }
    });
  } catch (error) {
    console.error("Telemetry API Error:", error);
    return new Response(JSON.stringify({ 
      aws: { status: "OFFLINE", requests: 0 } 
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
};