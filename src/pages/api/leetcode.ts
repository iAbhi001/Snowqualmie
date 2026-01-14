import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const handle = import.meta.env.PUBLIC_LEETCODE_USER || "mmulpuri";
  const controller = new AbortController();
  // Fail after 8 seconds to stay under the 10s serverless limit
  const timeoutId = setTimeout(() => controller.abort(), 8000); 

  try {
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${handle}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('External_Node_Failure');
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("LEETCODE_API_TIMEOUT:", error);
    return new Response(JSON.stringify({ error: "Uplink_Timeout" }), { status: 504 });
  }
};