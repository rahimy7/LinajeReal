import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Pool } from "pg";
import { communityDatabase } from "./community";

export const socialAdminRouter = Router();
type Channel = "facebook" | "instagram";
interface Settings { facebook_enabled: boolean; facebook_page_id: string; facebook_page_access_token: string; instagram_enabled: boolean; instagram_business_account_id: string; instagram_access_token: string }
async function settings(db: Pool) {
  const result = await db.query<Settings>("SELECT facebook_enabled,facebook_page_id,facebook_page_access_token,instagram_enabled,instagram_business_account_id,instagram_access_token FROM public.integration_settings WHERE id=1");
  return result.rows[0];
}
function connection(s: Settings | undefined, channel: Channel) {
  const token = channel === "facebook" ? s?.facebook_page_access_token : s?.instagram_access_token || s?.facebook_page_access_token;
  const id = channel === "facebook" ? s?.facebook_page_id : s?.instagram_business_account_id;
  const enabled = channel === "facebook" ? s?.facebook_enabled : s?.instagram_enabled;
  if (!enabled || !token || !id || !/^\d+$/.test(id)) throw new Error("Conecta primero esta cuenta en Ajustes de redes sociales y autoriza los permisos de lectura.");
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!/^v\d+\.0$/.test(version)) throw new Error("Revisa la versión de la API de Meta.");
  return { token, id, base: `https://${channel === "instagram" && token.startsWith("IG") ? "graph.instagram.com" : "graph.facebook.com"}/${version}` };
}
async function graph(config: ReturnType<typeof connection>, path: string) {
  const response = await fetch(`${config.base}/${path}`, { method: "GET", redirect: "error", signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${config.token}` } });
  const result = await response.json() as any;
  if (!response.ok || result.error) {
    // Do not return raw provider payloads: they can contain credentials and internal details.
    throw new Error(`Meta rechazó la operación${result.error?.code ? ` (código ${Number(result.error.code)})` : ""}. Revisa permisos, token y formato del contenido en Ajustes.`);
  }
  return result;
}
const safeUrl = z.string().url().max(2000).refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; });
const handler = (fn: Function) => async (req: any, res: any) => {
  try { await fn(req, res); } catch (error) {
    res.status(error instanceof z.ZodError ? 400 : 502).json({ error: error instanceof z.ZodError ? "Revisa los campos de la publicación." : "No se pudo completar la operación. Revisa la conexión de Meta y sus permisos." });
  }
};
export async function publicSocialPosts(db: Pool) {
  return (await db.query("SELECT id,channel,message,image_url,permalink FROM linaje_web.social_posts WHERE published AND state='imported' ORDER BY created_at DESC LIMIT 12")).rows;
}
socialAdminRouter.get("/", handler(async (_req: any, res: any) => {
  const db = await communityDatabase();
  const s = await settings(db);
  const channels = (["facebook", "instagram"] as const).map(channel => { try { connection(s,channel); return { channel, connected: true }; } catch { return { channel, connected: false }; } });
  res.json({ channels, posts: (await db.query("SELECT * FROM linaje_web.social_posts WHERE state='imported' ORDER BY created_at DESC LIMIT 100")).rows });
}));
socialAdminRouter.post("/import", handler(async (req: any, res: any) => {
  const { channel } = z.object({ channel: z.enum(["facebook", "instagram"]) }).parse(req.body);
  const db = await communityDatabase();
  const config = connection(await settings(db), channel);
  const fields = channel === "facebook" ? "id,message,full_picture,permalink_url" : "id,caption,media_url,media_type,permalink";
  const result = await graph(config, `${config.id}/${channel === "facebook" ? "posts" : "media"}?fields=${fields}&limit=12`);
  let imported = 0;
  for (const item of result.data || []) {
    const image = channel === "facebook" ? item.full_picture : item.media_type === "IMAGE" ? item.media_url : null;
    const permalink = channel === "facebook" ? item.permalink_url : item.permalink;
    if (!safeUrl.safeParse(permalink).success || (image && !safeUrl.safeParse(image).success)) continue;
    await db.query("INSERT INTO linaje_web.social_posts(id,channel,message,image_url,external_id,permalink,state) VALUES($1,$2,$3,$4,$5,$6,'imported') ON CONFLICT(channel,external_id) DO UPDATE SET message=EXCLUDED.message,image_url=EXCLUDED.image_url,permalink=EXCLUDED.permalink,published=false", [randomUUID(),channel,String(item.message || item.caption || "").slice(0,2200),image || null,String(item.id),permalink]);
    imported++;
  }
  res.json({ imported });
}));
socialAdminRouter.patch("/:id", handler(async (req: any, res: any) => {
  const { published } = z.object({ published: z.boolean() }).parse(req.body);
  const db = await communityDatabase();
  const result = await db.query("UPDATE linaje_web.social_posts SET published=$1 WHERE id=$2 AND state='imported' RETURNING id", [published,z.string().uuid().parse(req.params.id)]);
  res.status(result.rowCount ? 200 : 409).json({ ok: Boolean(result.rowCount) });
}));

// This feature only reads Meta content; unknown write operations are rejected.
socialAdminRouter.use((_req, res) => { res.status(404).json({ error: 'Operación no disponible.' }); });

