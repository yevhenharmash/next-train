import path from "node:path";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleBoardRequest, readBoardQuery } from "./server/board.ts";
import { demoBoard } from "./server/demo.ts";

/**
 * Serves /api/board in dev with the same handler Vercel runs (server/board.ts).
 * RDM_KEY is read here, in Node: it has no VITE_ prefix, so it's never bundled into the client.
 * Without a key it serves generated demo data instead.
 */
function boardApi(apiKey: string | undefined): Plugin {
  return {
    name: "next-train:board-api",
    configureServer(server) {
      if (!apiKey) server.config.logger.warn("RDM_KEY not set: /api/board serves demo data.");
      server.middlewares.use("/api/board", (req, res) => {
        const url = new URL(req.originalUrl ?? req.url ?? "/", "http://localhost");
        const respond = async (): Promise<Response> => {
          if (apiKey) return handleBoardRequest(url, apiKey);
          const query = readBoardQuery(url.searchParams);
          if (typeof query === "string") return Response.json({ error: query }, { status: 400 });
          const board = demoBoard(new Date());
          if (query.filterCrs !== "EUS") {
            // The demo only knows the Euston timetable.
            board.filterLocationName = query.filterCrs;
            board.filtercrs = query.filterCrs;
            board.trainServices = [];
          }
          return new Response(JSON.stringify(board), {
            headers: { "content-type": "application/json", "x-board-source": "demo" },
          });
        };
        respond()
          .then(async (response) => {
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(await response.text());
          })
          .catch((error: unknown) => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(error) }));
          });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // "" loads every variable from .env files, not just VITE_* ones. Only used here, server-side.
  const env = loadEnv(mode, import.meta.dirname, "");
  return {
    plugins: [react(), tailwindcss(), boardApi(env.RDM_KEY || process.env.RDM_KEY)],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },
    test: {
      include: ["src/**/*.test.ts"],
    },
  };
});
