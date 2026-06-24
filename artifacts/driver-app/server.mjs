import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || "https://workspaceapi-server-production-acef.up.railway.app";

const app = express();

app.use(createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathFilter: '/api',
}));
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Driver app on port ${PORT}`));
