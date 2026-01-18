import type { APIRoute } from 'astro';
import { getLiveMetrics } from '../../lib/aws';

export const GET: APIRoute = async () => {
  try {
    const data = await getLiveMetrics();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "OFFLINE", requests: 0 }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};