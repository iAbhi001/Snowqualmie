import type { APIRoute } from 'astro';
import { getLiveMetrics, getMarketData, getLatestNews } from '../../lib/aws';

export const GET: APIRoute = async () => {
  // Fetch all data in parallel to reduce load time
  const [aws, market, news] = await Promise.all([
    getLiveMetrics(),
    getMarketData('AAPL'), // Tracking Apple Inc. as a tech baseline
    getLatestNews()
  ]);

  return new Response(JSON.stringify({
    aws,
    market,
    news: news.slice(0, 5), // Send top 5 headlines for the ticker
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60" // Cache for 1 minute to save API credits
    }
  });
};