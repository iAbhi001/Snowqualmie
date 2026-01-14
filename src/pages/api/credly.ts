// src/pages/api/credly.ts
export async function GET() {
  try {
    // Replace with your actual Credly username
    const username = "mamulpuri";
    const response = await fetch(`https://www.credly.com/users/${username}/badges.json`);
    
    if (!response.ok) throw new Error("Failed to fetch from Credly");
    
    const data = await response.json();
    
    // We only return the necessary fields for your glassmorphic UI
    const badges = data.data.map((badge: any) => ({
      title: badge.badge_template.name,
      issuer: badge.issuer.entities[0].entity.name,
      image: badge.badge_template.image_url,
      link: `https://www.credly.com/badges/${badge.id}/public_url`,
      date: new Date(badge.issued_at).getFullYear().toString()
    }));

    return new Response(JSON.stringify(badges), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Uplink Failure" }), { status: 500 });
  }
}