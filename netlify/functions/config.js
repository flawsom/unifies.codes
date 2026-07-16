import { getPublicConfig } from "../../api/_lib/config.js";

export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { "Cache-Control": "public, max-age=60" },
    body: JSON.stringify(getPublicConfig()),
  };
};
