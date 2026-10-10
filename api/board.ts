// Vercel function: GET /api/board?crs=WFJ&filterCrs=EUS. Set RDM_KEY (and RDM_BASE_URL if needed) in the Vercel env vars.
// The .js extension is needed at runtime under "type": "module"; TypeScript resolves it to board.ts.
import { handleBoardRequest } from "../server/board.js";

export function GET(request: Request): Promise<Response> {
  return handleBoardRequest(new URL(request.url), {
    apiKey: process.env.RDM_KEY,
    baseUrl: process.env.RDM_BASE_URL,
  });
}
