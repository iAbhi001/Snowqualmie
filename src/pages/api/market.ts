import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  // Use the key exactly as it appears in your .env
  const apiKey = import.meta.env.POLYGON_API_KEY || "j3MOp6wDdENRmQgnVeM4kLFaAAi_zp16";
  const symbols = url.searchParams.get('symbols');

  if (!symbols) return new Response(JSON.stringify({ tickers: [] }));

  try {
    // Direct fetch to the Polygon/Massive Snapshot API
    // This bypasses SDK version mismatches and handles batching
    const response = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${symbols}&apiKey=${apiKey}`
    );
    
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'LTP Fetch Failed', details: e }), { status: 500 });
  }
}