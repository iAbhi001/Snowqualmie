import type { APIRoute } from 'astro';
import { getVisitorCount } from '../../lib/aws';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  // Check if ?hit=true is in the URL
  const shouldIncrement = url.searchParams.get('hit') === 'true';

  try {
    const count = await getVisitorCount(shouldIncrement);
    
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ count: "000000", error: "API_FAIL" }), { status: 500 });
  }
};