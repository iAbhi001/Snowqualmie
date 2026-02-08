import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.API_KEY;
  const symbol = url.searchParams.get('symbol')?.toUpperCase();

  // If SSR is off, this check triggers the 400 Bad Request you see in the image
  if (!symbol) {
    return new Response(JSON.stringify({ error: 'NO SYMBOL' }), { status: 400 });
  }

  const apiURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(apiURL);
    const data = await response.json();

    if (data.Note) return new Response(JSON.stringify({ error: 'RATE LIMIT' }), { status: 429 });

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
       return new Response(JSON.stringify({ error: 'NOT FOUND' }), { status: 404 });
    }

    return new Response(JSON.stringify({
      price: quote['05. price'],
      changePercent: quote['10. change percent']
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'SERVER ERROR' }), { status: 500 });
  }
};

// 3. TYPE THE MARKER: Ensures lat/lon are recognized as numbers