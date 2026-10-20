import { Router } from "express";

/** Public readiness only. OmniAI owns authentication and all conversation APIs. */
export const omnichannelRouter = Router();

export function panelOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("OMNICHANNEL_URL debe ser el origen HTTPS de la instancia exclusiva de Linaje Real.");
  }
  return url.origin;
}

omnichannelRouter.get("/status", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  let origin: string | null;
  try { origin = panelOrigin(process.env.OMNICHANNEL_URL); }
  catch { res.status(503).json({ state: "configuration-error" }); return; }
  if (!origin) { res.json({ state: "not-configured" }); return; }
  try {
    const upstream = await fetch(`${origin}/api/readyz`, {
      signal: AbortSignal.timeout(8000), redirect: "error",
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) throw new Error("not ready");
    const health = await upstream.json() as { status?: string; client?: string };
    // Never embed another customer's panel, even if the environment URL was mistyped.
    if (health.client !== "linaje-real") {
      res.status(503).json({ state: "wrong-instance" }); return;
    }
    if (health.status !== "ok") throw new Error("not ready");
    res.json({ state: "ready", panelUrl: `${origin}/` });
  } catch { res.status(503).json({ state: "unavailable" }); }
});
