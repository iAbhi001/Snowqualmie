import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Use your actual username
  const username = "mmulpuri";
  
  try {
    // 🚀 Using a reliable Unofficial Proxy API instead of direct GraphQL
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`, {
      method: "GET",
      headers: { 
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Proxy returned status: ${response.status}`);
    }

    const data = await response.json();

    // Standardize the response format for your dashboard
    return new Response(JSON.stringify({
      totalSolved: data.solvedProblem || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      acceptanceRate: data.acceptanceRate || 0
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("LEETCODE_PROXY_ERROR:", error);
    return new Response(JSON.stringify({ 
      error: "Uplink Offline", 
      details: "LeetCode Proxy is unreachable" 
    }), { status: 500 });
  }
};