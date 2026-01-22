import type { APIRoute } from 'astro';
import { getLiveMetrics } from '../../lib/aws';

export const GET: APIRoute = async () => {
  try {
    // We only call getLiveMetrics now since market/news were removed
    const aws = await getLiveMetrics();
    
    return new Response(JSON.stringify({
      aws: {
        status: aws.status,
        requests: 0 // Keep as 0 to satisfy frontend logic without crashing
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
    }), { status: 200 });
  }
};