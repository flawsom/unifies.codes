// netlify/functions/runtime-config.js
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { "Cache-Control": "public, max-age=60" },
    body: JSON.stringify({
      url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
      key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
    }),
  };
};
