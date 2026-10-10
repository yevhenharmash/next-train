// Vercel function: GET /api/board?crs=WFJ&filterCrs=EUS. Set RDM_KEY in the Vercel project's env vars.
// The .js extension is needed at runtime under "type": "module"; TypeScript resolves it to board.ts.
import { handleBoardRequest } from "../server/board.js";

export function GET(request: Request): Promise<Response> {
  return handleBoardRequest(new URL(request.url), process.env.RDM_KEY);
}
