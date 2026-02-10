import type { APIRoute } from 'astro';

export const prerender = false;

// Fallback data if the API is totally dead and memory is fresh
const FALLBACK_STATS = {
  totalSolved: 624, 
  easySolved: 373,
  mediumSolved: 240,
  hardSolved: 11,
  acceptanceRate: 68.9,
  isStale: true
};

let cachedStats = { ...FALLBACK_STATS };
let lastFetch = 0;
const CACHE_TTL = 30 * 60 * 1000; 

export const GET: APIRoute = async () => {
  const now = Date.now();

  // 1. Memory Cache Check
  if (!cachedStats.isStale && (now - lastFetch < CACHE_TTL)) {
    return new Response(JSON.stringify(cachedStats), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Cache-Control": "public, max-age=1800", // Tell browser/CDN to cache for 30 mins
        "X-Cache-Status": "HIT" 
      }
    });
  }

  try {
    const response = await fetch('https://leetcode-stats-api.herokuapp.com/mmulpuri', {
      signal: AbortSignal.timeout(5000) // Don't let a slow API hang your whole site
    });

    if (!response.ok) {
       throw new Error(`LeetCode API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // 2. Validate Data (Crucial: don't overwrite cache with zeros)
    if (data.status === "success") {
        cachedStats = {
          totalSolved: data.totalSolved || FALLBACK_STATS.totalSolved,
          easySolved: data.easySolved || FALLBACK_STATS.easySolved,
          mediumSolved: data.mediumSolved || FALLBACK_STATS.mediumSolved,
          hardSolved: data.hardSolved || FALLBACK_STATS.hardSolved,
          acceptanceRate: data.acceptanceRate || FALLBACK_STATS.acceptanceRate,
          isStale: false
        };
        lastFetch = now;
    }

    return new Response(JSON.stringify(cachedStats), { 
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache-Status": "MISS" }
    });

  } catch (error) {
    console.error("🛰️ LeetCode Sync Failed:", error);
    // Return whatever we have in memory, even if it's the fallback
    return new Response(JSON.stringify({ ...cachedStats, isStale: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", "X-Cache-Error": "TRUE" }
    });
  }
};