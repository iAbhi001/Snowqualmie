import type { APIRoute } from 'astro';

export const prerender = false;

const LEETCODE_USER = "mmulpuri";
const GQL_URL = "https://leetcode.com/graphql";

const FALLBACK_DATA = {
  totalSolved: 633,
  easySolved: 377,
  mediumSolved: 245,
  hardSolved: 11,
  recentSubmissions: [],
  isStale: true
};

let cachedStats = { ...FALLBACK_DATA };
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
        "X-Cache-Status": "HIT" 
      }
    });
  }

  // 2. GraphQL Query Definition
  const graphqlQuery = {
    query: `
      query getLeetCodeData($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        recentAcSubmissionList(username: $username, limit: 5) {
          title
          timestamp
        }
      }
    `,
    variables: { username: LEETCODE_USER },
  };

  try {
    const response = await fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphqlQuery),
      signal: AbortSignal.timeout(8000) 
    });

    if (!response.ok) throw new Error("LeetCode GQL unreachable");

    const result = await response.json();
    
    // 3. Data Extraction
    const stats = result.data.matchedUser.submitStats.acSubmissionNum;
    const submissions = result.data.recentAcSubmissionList;

    cachedStats = {
      totalSolved: stats.find((s: any) => s.difficulty === "All")?.count || FALLBACK_DATA.totalSolved,
      easySolved: stats.find((s: any) => s.difficulty === "Easy")?.count || FALLBACK_DATA.easySolved,
      mediumSolved: stats.find((s: any) => s.difficulty === "Medium")?.count || FALLBACK_DATA.mediumSolved,
      hardSolved: stats.find((s: any) => s.difficulty === "Hard")?.count || FALLBACK_DATA.hardSolved,
      recentSubmissions: submissions || [],
      isStale: false
    };

    lastFetch = now;

    return new Response(JSON.stringify(cachedStats), { 
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache-Status": "MISS" }
    });

  } catch (error) {
    console.error("🛰️ LeetCode GQL Sync Failed:", error);
    return new Response(JSON.stringify({ ...cachedStats, isStale: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", "X-Cache-Error": "TRUE" }
    });
  }
};