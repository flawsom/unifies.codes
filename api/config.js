import { getPublicConfig } from "./_lib/config.js";

export default async function handler(req, res) {
  // Cache briefly at the edge; public anon config is not sensitive.
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).json(getPublicConfig());
}
