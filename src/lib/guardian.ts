// src/lib/guardian.ts
const GUARDIAN_KEY = import.meta.env.GUARDIAN_API_KEY;

export async function getMarketNews() {
  const response = await fetch(
    `https://content.guardianapis.com/search?q=finance&api-key=${GUARDIAN_KEY}`
  );
  return await response.json();
}