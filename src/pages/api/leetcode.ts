import type { APIRoute } from 'astro';

export const prerender = false;

let cachedStats = {
  totalSolved: 624, 
  easySolved: 373,
  mediumSolved: 240,
  hardSolved: 11,
  acceptanceRate: 68.85,
  isStale: true
};

let lastFetch = 0;
const CACHE_TTL = 30 * 60 * 1000; 

export const GET: APIRoute = async () => {
  const now = Date.now();

  
  if (!cachedStats.isStale && (now - lastFetch < CACHE_TTL)) {
    return new Response(JSON.stringify(cachedStats), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
    });
  }

  try {
    const response = await fetch( 'https://leetcode-stats-api.herokuapp.com/mmulpuri', {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (response.status === 429) {
      console.warn("LeetCode Rate Limited. Serving stale cache.");
      return new Response(JSON.stringify(cachedStats), { status: 200 });
    }

    const data = await response.json();
    
    cachedStats = {
      totalSolved: data.solvedProblem || 617,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      acceptanceRate: data.acceptanceRate || 0,
      isStale: false
    };
    lastFetch = now;

    return new Response(JSON.stringify(cachedStats), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify(cachedStats), { status: 200 });
  }
};