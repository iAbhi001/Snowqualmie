import type { APIRoute } from 'astro';
import { getLiveMetrics } from './aws';

export const GET: APIRoute = async () => {
  const data = await getLiveMetrics();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};