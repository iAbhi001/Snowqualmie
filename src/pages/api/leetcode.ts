import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Using an unofficial LeetCode stats API
    const response = await fetch('https://leetcode-stats-api.herokuapp.com/mmulpuri');
    const data = await response.json();

    if (data.status === 'success') {
      return new Response(JSON.stringify({
        totalSolved: data.totalSolved,
        easySolved: data.easySolved,
        mediumSolved: data.mediumSolved,
        hardSolved: data.hardSolved,
        acceptanceRate: data.acceptanceRate
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}